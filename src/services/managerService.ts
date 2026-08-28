import { supabase } from '@/utils/supabase';
import { DisasterAlert, parseRssXml, parseCapXmlDetails } from './rssParser';
import { GdacsService, GdacsGeometry } from './gdacsService';
import { getStateGeoInfo, isAlertForState } from '@/constants/stateKeywords';

export interface AgencySectorAssignment {
  managerId: string;
  orgName: string;
  teamCount: number;
  updatedAt?: string;
}

export interface GridCellData {
  id: string; // e.g. "cell-2-3"
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  center: {
    latitude: number;
    longitude: number;
  };
  teamCount: number; // Total across ALL relief agencies
  coverage: 'uncovered' | 'partial' | 'covered'; // red (0), grey (1-2), green (3+)
  assignedByMe?: boolean;
  myOrgTeamCount?: number;
  agencies: AgencySectorAssignment[];
}

export interface TeamData {
  id: string;
  name: string;
  size: 5 | 10;
  members: string[];
  status: 'available' | 'deployed' | 'standby';
  manager_id?: string;
}

export interface InventoryItem {
  id?: string;
  item_name: string;
  quantity: number;
  unit: string;
  category?: string;
  manager_id?: string;
}

export interface CitizenHelpRequest {
  id: string;
  citizen_id?: string;
  for_whom: 'me' | 'someone';
  disaster_type: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  person_name?: string;
  person_phone?: string;
  person_aadhaar?: string;
  additional_info?: string;
  state?: string;
  status: 'pending' | 'acknowledged' | 'preparing' | 'dispatched' | 'in_progress' | 'resolved' | 'cancelled';
  status_note?: string;
  assigned_manager_id?: string;
  created_at: string;
}

export interface DeploymentRecord {
  id?: string;
  manager_id?: string;
  team_id?: string;
  team_name: string;
  team_size: number;
  disaster_guid?: string;
  help_request_id?: string;
  grid_cells: string[];
  supplies: Record<string, number>;
  transport: string;
  transport_notes?: string;
  status?: string;
  dispatched_at?: string;
}

const NDMA_RSS_URL = 'https://sachet.ndma.gov.in/cap_public_website/rss/rss_india.xml';

// Sample fallback alerts in case of network restrictions
const FALLBACK_ALERTS: DisasterAlert[] = [
  {
    guid: '1787749908017010',
    title: 'Due to continuous increase of water level of River Beki at Beki NH Crossing in Barpeta district of Assam, Citizens are advised to stay away from the river. Issued by ASDMA.',
    description: 'River Beki at Beki NH Crossing in Barpeta district of Assam continues to flow in above normal flood situation.',
    author: 'controlroom@ndma.gov.in (ASDMA)',
    pubDate: new Date().toUTCString(),
    link: 'https://sachet.ndma.gov.in/cap_public_website/FetchXMLFile?identifier=1787749908017010',
    category: 'Flood',
    eventType: 'Flood',
    severity: 'Severe',
    areaDesc: 'Barpeta, Assam',
    latitude: 26.49,
    longitude: 90.91,
  },
  {
    guid: '1787747843204016',
    title: 'River Bagmati at Benibad in Muzaffarpur district of Bihar continues to flow in above normal flood situation.',
    description: 'River Bagmati water level rising above warning mark in Muzaffarpur.',
    author: 'controlroom@ndma.gov.in (BSDMA)',
    pubDate: new Date().toUTCString(),
    link: 'https://sachet.ndma.gov.in/cap_public_website/FetchXMLFile?identifier=1787747843204016',
    category: 'Flood',
    eventType: 'Flood',
    severity: 'Moderate',
    areaDesc: 'Muzaffarpur, Bihar',
    latitude: 26.12,
    longitude: 85.39,
  },
  {
    guid: '1787741647119007',
    title: 'Heavy Rain with Thunderstorm and lightning is likely to occur over Chennai, Kancheepuram, Thiruvallur in next 3 hours.',
    description: 'Intense rain bands passing over coastal Tamil Nadu with waterlogging risk.',
    author: 'controlroom@ndma.gov.in (TNDMA)',
    pubDate: new Date().toUTCString(),
    link: 'https://sachet.ndma.gov.in/cap_public_website/FetchXMLFile?identifier=1787741647119007',
    category: 'Met',
    eventType: 'Cyclone / Heavy Rain',
    severity: 'Severe',
    areaDesc: 'Chennai, Tamil Nadu',
    latitude: 13.0827,
    longitude: 80.2707,
  },
];

export const ManagerService = {
  /**
   * 1. Fetch RSS Disasters and filter by manager's state of operations
   */
  async fetchDisasterAlerts(managerState: string): Promise<DisasterAlert[]> {
    try {
      const res = await fetch(NDMA_RSS_URL, {
        headers: { 'Cache-Control': 'no-cache' },
      });

      let alerts: DisasterAlert[] = [];

      if (res.ok) {
        const xmlText = await res.text();
        alerts = parseRssXml(xmlText);
      }

      if (alerts.length === 0) {
        alerts = [...FALLBACK_ALERTS];
      }

      // Filter by state
      const stateFiltered = alerts.filter((alert) =>
        isAlertForState(alert.title + ' ' + alert.author + ' ' + (alert.description || ''), managerState)
      );

      // If strict filter is empty, return state alerts or all India alerts
      const resultAlerts = stateFiltered.length > 0 ? stateFiltered : alerts;

      // Extract details & approximate coordinates for top alerts
      return resultAlerts.map((item) => {
        let alertState = managerState;
        if (!alertState || alertState.toLowerCase() === 'all' || alertState.toLowerCase() === 'all india') {
          // Detect state from alert text for accurate geospatial placement
          for (const s of [
            'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
            'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
            'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
            'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
            'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi'
          ]) {
            if (isAlertForState(item.title + ' ' + item.author + ' ' + (item.description || ''), s)) {
              alertState = s;
              break;
            }
          }
        }
        const stateInfo = getStateGeoInfo(alertState);
        return {
          ...item,
          latitude: item.latitude || stateInfo.center.latitude,
          longitude: item.longitude || stateInfo.center.longitude,
          extractedState: alertState,
        };
      });
    } catch {
      // Fallback
      return FALLBACK_ALERTS.filter((alert) =>
        isAlertForState(alert.title + ' ' + alert.author, managerState)
      );
    }
  },

  /**
   * 2. Fetch CAP XML details for a specific alert
   */
  async fetchAlertDetails(alert: DisasterAlert): Promise<DisasterAlert> {
    if (!alert.link) return alert;

    try {
      const res = await fetch(alert.link);
      if (res.ok) {
        const xml = await res.text();
        const details = parseCapXmlDetails(xml);
        return {
          ...alert,
          ...details,
          latitude: details.latitude || alert.latitude,
          longitude: details.longitude || alert.longitude,
        };
      }
    } catch {
      // Keep existing alert
    }
    return alert;
  },

  /**
   * 3. Fetch GDACS geometry if available for coordinates
   */
  async fetchGdacsGeometry(lat: number, lon: number): Promise<GdacsGeometry | null> {
    const event = await GdacsService.fetchEventsNear(lat, lon, 250);
    return event?.geometry || null;
  },

  /**
   * 4. Build Grid Cells for Map
   * Generates a 6x6 grid around the target disaster center or bounding box
   */
  generateGridCells(
    centerLat: number,
    centerLng: number,
    gridSize: number = 6,
    spanDeg: number = 0.6
  ): GridCellData[] {
    const cells: GridCellData[] = [];
    const halfSpan = spanDeg / 2;
    const step = spanDeg / gridSize;

    const startLat = centerLat + halfSpan;
    const startLng = centerLng - halfSpan;

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const north = startLat - r * step;
        const south = north - step;
        const west = startLng + c * step;
        const east = west + step;

        cells.push({
          id: `cell-${r}-${c}`,
          bounds: { north, south, east, west },
          center: {
            latitude: (north + south) / 2,
            longitude: (east + west) / 2,
          },
          teamCount: 0,
          coverage: 'uncovered',
          agencies: [],
        });
      }
    }

    return cells;
  },

  /**
   * 5. Get Grid Assignments from Supabase across ALL Relief Organizations
   */
  async getGridAssignments(
    disasterGuid: string,
    currentManagerId?: string
  ): Promise<Record<string, { teamCount: number; assignedByMe: boolean; myOrgTeamCount: number; agencies: AgencySectorAssignment[] }>> {
    const result: Record<string, { teamCount: number; assignedByMe: boolean; myOrgTeamCount: number; agencies: AgencySectorAssignment[] }> = {};

    try {
      const { data, error } = await supabase
        .from('grid_assignments')
        .select('*')
        .eq('disaster_guid', disasterGuid);

      if (error) throw error;

      if (data && data.length > 0) {
        for (const row of data) {
          const isMe = currentManagerId ? row.manager_id === currentManagerId : false;
          const prev = result[row.cell_id] || { teamCount: 0, assignedByMe: false, myOrgTeamCount: 0, agencies: [] };
          const rowCount = row.team_count || 1;

          prev.teamCount += rowCount;
          if (isMe) {
            prev.assignedByMe = true;
            prev.myOrgTeamCount += rowCount;
          }

          prev.agencies.push({
            managerId: row.manager_id,
            orgName: row.org_name || 'Relief Agency Unit',
            teamCount: rowCount,
            updatedAt: row.updated_at,
          });

          result[row.cell_id] = prev;
        }
        return result;
      }
    } catch {
      // Table may not exist yet or offline fallback
    }

    // Default multi-agency deployments across sectors so managers see inter-agency distribution
    const mockMultiAgency: Record<string, { teamCount: number; assignedByMe: boolean; myOrgTeamCount: number; agencies: AgencySectorAssignment[] }> = {
      'cell-1-2': {
        teamCount: 2,
        assignedByMe: false,
        myOrgTeamCount: 0,
        agencies: [{ managerId: 'mgr-ndrf-1', orgName: 'NDRF 1st Battalion (Central)', teamCount: 2 }],
      },
      'cell-2-3': {
        teamCount: 3,
        assignedByMe: false,
        myOrgTeamCount: 0,
        agencies: [
          { managerId: 'mgr-sdrf', orgName: 'State SDRF Rapid Taskforce', teamCount: 2 },
          { managerId: 'mgr-redcross', orgName: 'Indian Red Cross Society', teamCount: 1 },
        ],
      },
      'cell-3-2': {
        teamCount: 1,
        assignedByMe: false,
        myOrgTeamCount: 0,
        agencies: [{ managerId: 'mgr-civil', orgName: 'Civil Defense Disaster Unit', teamCount: 1 }],
      },
      'cell-4-4': {
        teamCount: 4,
        assignedByMe: false,
        myOrgTeamCount: 0,
        agencies: [
          { managerId: 'mgr-ndrf-2', orgName: 'NDRF 4th Battalion (Flood Wing)', teamCount: 2 },
          { managerId: 'mgr-navy', orgName: 'Naval Amphibious Rescue Command', teamCount: 2 },
        ],
      },
    };

    return mockMultiAgency;
  },

  /**
   * 6. Save Grid Assignments to Supabase with Org Name
   */
  async saveGridAssignments(
    disasterGuid: string,
    managerId: string,
    orgName: string,
    cellIds: string[],
    teamCountPerCell: number = 1
  ): Promise<boolean> {
    try {
      const rows = cellIds.map((cellId) => {
        const coverage = teamCountPerCell >= 3 ? 'covered' : teamCountPerCell >= 1 ? 'partial' : 'uncovered';
        return {
          disaster_guid: disasterGuid,
          cell_id: cellId,
          manager_id: managerId,
          org_name: orgName || 'Relief Agency',
          team_count: teamCountPerCell,
          coverage,
          updated_at: new Date().toISOString(),
        };
      });

      const { error } = await supabase
        .from('grid_assignments')
        .upsert(rows, { onConflict: 'disaster_guid,cell_id,manager_id' });

      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('saveGridAssignments warning:', e);
      return false;
    }
  },

  /**
   * 7. Save Disaster Assignment claim
   */
  async claimDisaster(managerId: string, alert: DisasterAlert, managerState: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('disaster_assignments')
        .upsert({
          manager_id: managerId,
          disaster_guid: alert.guid,
          disaster_title: alert.title,
          event_type: alert.eventType || alert.category,
          state: managerState,
          center_lat: alert.latitude,
          center_lon: alert.longitude,
          assigned_at: new Date().toISOString(),
        }, { onConflict: 'manager_id,disaster_guid' });

      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('claimDisaster warning:', e);
      return false;
    }
  },

  /**
   * 8. Fetch Citizen Help Requests
   */
  async fetchHelpRequests(managerState?: string): Promise<CitizenHelpRequest[]> {
    try {
      let query = supabase
        .from('help_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (managerState && managerState.toLowerCase() !== 'all') {
        query = query.or(`state.ilike.%${managerState}%,state.is.null`);
      }

      const { data, error } = await query;
      if (error) throw error;
      if (data && data.length > 0) return data as CitizenHelpRequest[];
    } catch (e) {
      console.warn('fetchHelpRequests note:', e);
    }

    // Default mock requests for instant smooth preview
    return [
      {
        id: 'REQ-101',
        for_whom: 'me',
        disaster_type: 'Flood',
        latitude: 26.12,
        longitude: 85.39,
        address: 'Sector 4, Low-lying riverbank zone, Muzaffarpur',
        person_name: 'Rahul Sharma',
        person_phone: '+91 9876543210',
        additional_info: '4 adults and 2 children stranded on terrace due to rising water level. Need rescue boat & rations urgently.',
        state: managerState || 'Bihar',
        status: 'pending',
        created_at: new Date().toISOString(),
      },
      {
        id: 'REQ-102',
        for_whom: 'someone',
        disaster_type: 'Medical Emergency',
        latitude: 26.49,
        longitude: 90.91,
        address: 'Barpeta Primary Health Center road',
        person_name: 'Anjali Das',
        person_phone: '+91 9811223344',
        additional_info: 'Elderly patient with oxygen cylinder shortage and fever. Road submerged.',
        state: managerState || 'Assam',
        status: 'acknowledged',
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'REQ-103',
        for_whom: 'me',
        disaster_type: 'Building Collapse',
        latitude: 13.08,
        longitude: 80.27,
        address: 'North Beach Road, Chennai',
        person_name: 'K. Venkatesh',
        person_phone: '+91 9944556677',
        additional_info: 'Partial roof collapse following storm surge. 3 people trapped in ground floor room.',
        state: managerState || 'Tamil Nadu',
        status: 'dispatched',
        created_at: new Date(Date.now() - 7200000).toISOString(),
      },
    ];
  },

  /**
   * 9. Update Help Request Status
   */
  async updateHelpRequestStatus(
    requestId: string,
    status: CitizenHelpRequest['status'],
    statusNote?: string,
    managerId?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('help_requests')
        .update({
          status,
          status_note: statusNote,
          assigned_manager_id: managerId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('updateHelpRequestStatus warning:', e);
      return false;
    }
  },

  /**
   * 10. Fetch Preset Teams (Sizes of 5 and 10)
   */
  async fetchTeams(managerId?: string): Promise<TeamData[]> {
    const defaultTeams: TeamData[] = [
      {
        id: 'team-alpha-5',
        name: 'Rapid Response Alpha',
        size: 5,
        members: ['Inspector R. Roy (Lead)', 'M. Sen (Paramedic)', 'V. Kumar (Diver)', 'A. Joshi (Logistics)', 'S. Patel (Radio/Comms)'],
        status: 'available',
      },
      {
        id: 'team-bravo-10',
        name: 'Heavy Evacuation Bravo',
        size: 10,
        members: [
          'Capt. K. Singh (Commander)', 'Lt. P. Nair (Deputy)', 'Dr. R. Verma (Doctor)',
          'T. Roy (Paramedic)', 'H. Ali (Boat Specialist)', 'G. Rao (Climber)',
          'N. Gupta (Heavy Eq.)', 'R. Das (Search Dog Handler)', 'K. George (Comms)', 'P. Yadav (Logistics)'
        ],
        status: 'available',
      },
      {
        id: 'team-charlie-5',
        name: 'Medical Strike Charlie',
        size: 5,
        members: ['Dr. S. Mukherjee', 'Nurse T. Devi', 'Paramedic B. Khan', 'Driver A. Mishra', 'Eq. Tech K. Sahani'],
        status: 'available',
      },
      {
        id: 'team-delta-10',
        name: 'Flood Rescue Squad Delta',
        size: 10,
        members: [
          'Sub-Maj. D. Rawat', 'Havildar P. Thapa', 'Naik S. Yadav',
          'Sepoy R. Mondal', 'Sepoy J. Bora', 'Sepoy T. Soren',
          'Paramedic M. Chahal', 'Operator D. Gogoi', 'Technician R. Lal', 'Spotter V. Rana'
        ],
        status: 'available',
      },
    ];

    if (!managerId) return defaultTeams;

    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('manager_id', managerId)
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as TeamData[];
      }

      // If empty, auto-seed defaults for this manager
      for (const t of defaultTeams) {
        await supabase.from('teams').insert({
          manager_id: managerId,
          name: t.name,
          size: t.size,
          members: t.members,
          status: 'available',
        });
      }
    } catch {
      // Fallback
    }

    return defaultTeams;
  },

  /**
   * 11. Add / Save Custom Team
   */
  async saveTeam(managerId: string, team: Partial<TeamData>): Promise<boolean> {
    try {
      const { error } = await supabase.from('teams').upsert({
        id: team.id?.startsWith('team-') ? undefined : team.id,
        manager_id: managerId,
        name: team.name,
        size: team.size || 5,
        members: team.members || [],
        status: team.status || 'available',
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('saveTeam warning:', e);
      return false;
    }
  },

  /**
   * 12. Fetch Inventory Stock
   */
  async fetchInventory(managerId?: string): Promise<InventoryItem[]> {
    const defaultInventory: InventoryItem[] = [
      { item_name: 'Emergency Ration Packs', quantity: 500, unit: 'packs', category: 'Food' },
      { item_name: 'Clean Drinking Water', quantity: 1200, unit: 'litres', category: 'Water' },
      { item_name: 'First Aid & Trauma Kits', quantity: 60, unit: 'kits', category: 'Medical' },
      { item_name: 'Thermal Blankets', quantity: 250, unit: 'units', category: 'Shelter' },
      { item_name: 'Essential Medicines Pack', quantity: 150, unit: 'boxes', category: 'Medical' },
      { item_name: 'Life Jackets & Buoys', quantity: 45, unit: 'units', category: 'Rescue' },
      { item_name: 'Emergency Tarpaulin & Tents', quantity: 30, unit: 'sets', category: 'Shelter' },
      { item_name: 'Water Purification Tablets', quantity: 3000, unit: 'strips', category: 'Water' },
    ];

    if (!managerId) return defaultInventory;

    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('manager_id', managerId)
        .order('item_name', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as InventoryItem[];
      }

      // Auto-seed defaults if table is empty
      for (const item of defaultInventory) {
        await supabase.from('inventory').upsert({
          manager_id: managerId,
          item_name: item.item_name,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
        }, { onConflict: 'manager_id,item_name' });
      }
    } catch {
      // Fallback
    }

    return defaultInventory;
  },

  /**
   * 13. Update Inventory Stock Level
   */
  async updateInventoryItem(managerId: string, itemName: string, quantity: number, unit: string = 'units'): Promise<boolean> {
    try {
      const { error } = await supabase.from('inventory').upsert({
        manager_id: managerId,
        item_name: itemName,
        quantity: Math.max(0, quantity),
        unit,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'manager_id,item_name' });

      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('updateInventoryItem warning:', e);
      return false;
    }
  },

  /**
   * 14. Dispatch Mission: Deducts Stock & Records Deployment
   */
  async dispatchMission(
    managerId: string,
    deployment: DeploymentRecord
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Deduct selected supplies from inventory
      if (deployment.supplies && Object.keys(deployment.supplies).length > 0) {
        const currentInventory = await this.fetchInventory(managerId);

        for (const [itemName, requestedQty] of Object.entries(deployment.supplies)) {
          if (requestedQty > 0) {
            const currentItem = currentInventory.find((i) => i.item_name === itemName);
            if (currentItem) {
              const newQty = Math.max(0, currentItem.quantity - requestedQty);
              await this.updateInventoryItem(managerId, itemName, newQty, currentItem.unit);
            }
          }
        }
      }

      // 2. Insert Deployment record
      const { error: depError } = await supabase.from('deployments').insert({
        manager_id: managerId,
        team_id: deployment.team_id?.startsWith('team-') ? null : deployment.team_id,
        team_name: deployment.team_name,
        team_size: deployment.team_size,
        disaster_guid: deployment.disaster_guid,
        help_request_id: deployment.help_request_id?.startsWith('REQ-') ? null : deployment.help_request_id,
        grid_cells: deployment.grid_cells || [],
        supplies: deployment.supplies || {},
        transport: deployment.transport,
        transport_notes: deployment.transport_notes,
        status: 'dispatched',
        dispatched_at: new Date().toISOString(),
      });

      if (depError) console.warn('Deployment insert note:', depError);

      // 3. If tied to a help request, update its status
      if (deployment.help_request_id) {
        await this.updateHelpRequestStatus(
          deployment.help_request_id,
          'dispatched',
          `Team ${deployment.team_name} (${deployment.team_size} operatives) dispatched via ${deployment.transport}.`,
          managerId
        );
      }

      // 4. Update team status to deployed
      if (deployment.team_id && !deployment.team_id.startsWith('team-')) {
        await supabase
          .from('teams')
          .update({ status: 'deployed', updated_at: new Date().toISOString() })
          .eq('id', deployment.team_id);
      }

      // 5. If grid cells are associated, record sector assignment for this manager
      if (deployment.grid_cells && deployment.grid_cells.length > 0 && deployment.disaster_guid) {
        await this.saveGridAssignments(
          deployment.disaster_guid,
          managerId,
          deployment.team_name || 'Relief Team',
          deployment.grid_cells,
          1
        );
      }

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Dispatch failed' };
    }
  },
};
