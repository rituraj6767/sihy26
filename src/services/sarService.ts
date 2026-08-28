import { supabase } from '@/utils/supabase';
import { CitizenHelpRequest, DeploymentRecord } from './managerService';

export type SARMissionStatus = 'pending' | 'preparing' | 'dispatched' | 'resolved';

export interface SARMission {
  id: string; // deployment ID or help_request ID
  helpRequestId?: string;
  deploymentId?: string;
  title: string;
  disasterType: string;
  requesterName: string;
  requesterPhone: string;
  address: string;
  latitude: number;
  longitude: number;
  additionalInfo?: string;
  managerInstructions?: string;
  allocatedSupplies: Record<string, number>;
  transportMode: string;
  teamName: string;
  teamSize: number;
  gridCells: string[];
  status: SARMissionStatus;
  statusNote?: string;
  dispatchedAt: string;
  managerOrgName?: string;
}

export const SarService = {
  /**
   * 1. Fetch Active Missions assigned by Relief Managers
   */
  async fetchAssignedMissions(sarOperativeId?: string): Promise<SARMission[]> {
    try {
      // 1. Query deployments joined with help_requests
      const { data: depData, error: depError } = await supabase
        .from('deployments')
        .select('*')
        .order('dispatched_at', { ascending: false });

      if (depError) console.warn('Fetch deployments error:', depError);

      const { data: hrData, error: hrError } = await supabase
        .from('help_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (hrError) console.warn('Fetch help_requests error:', hrError);

      const missions: SARMission[] = [];

      // Combine deployments with matching help requests
      if (depData && depData.length > 0) {
        for (const dep of depData) {
          const linkedHR = hrData?.find((hr) => hr.id === dep.help_request_id);

          // Map deployment status to SAR status
          let sarStatus: SARMissionStatus = 'dispatched';
          if (linkedHR?.status === 'preparing' || dep.status === 'preparing') sarStatus = 'preparing';
          else if (linkedHR?.status === 'resolved' || dep.status === 'completed') sarStatus = 'resolved';
          else if (linkedHR?.status === 'pending') sarStatus = 'pending';

          missions.push({
            id: dep.id || `DEP-${Math.random().toString(36).substr(2, 6)}`,
            deploymentId: dep.id,
            helpRequestId: dep.help_request_id || linkedHR?.id,
            title: linkedHR ? `${linkedHR.disaster_type} Rescue Mission` : 'Emergency Deployment',
            disasterType: linkedHR?.disaster_type || 'Disaster Relief',
            requesterName: linkedHR?.person_name || 'Citizen SOS',
            requesterPhone: linkedHR?.person_phone || '+91 Ground Comms',
            address: linkedHR?.address || 'Incident Sector Coordinates',
            latitude: linkedHR?.latitude || 26.49,
            longitude: linkedHR?.longitude || 90.91,
            additionalInfo: linkedHR?.additional_info || 'Immediate relief and extraction requested.',
            managerInstructions: dep.transport_notes || 'Proceed with high alert. Establish field triage upon arrival.',
            allocatedSupplies: dep.supplies || {},
            transportMode: dep.transport || 'Motorized Rescue Raft',
            teamName: dep.team_name || 'Rapid SAR Unit',
            teamSize: dep.team_size || 5,
            gridCells: dep.grid_cells || [],
            status: sarStatus,
            statusNote: linkedHR?.status_note || dep.transport_notes,
            dispatchedAt: dep.dispatched_at || new Date().toISOString(),
          });
        }
      }

      // Also include standalone urgent help requests with 'dispatched' or 'acknowledged' status
      if (hrData && hrData.length > 0) {
        for (const hr of hrData) {
          const alreadyAdded = missions.some((m) => m.helpRequestId === hr.id);
          if (!alreadyAdded) {
            let sarStatus: SARMissionStatus = 'pending';
            if (hr.status === 'preparing') sarStatus = 'preparing';
            else if (hr.status === 'dispatched') sarStatus = 'dispatched';
            else if (hr.status === 'resolved') sarStatus = 'resolved';

            missions.push({
              id: `HR-${hr.id}`,
              helpRequestId: hr.id,
              title: `${hr.disaster_type} SOS Call`,
              disasterType: hr.disaster_type,
              requesterName: hr.person_name || 'Citizen',
              requesterPhone: hr.person_phone || 'Unlisted',
              address: hr.address || `${hr.latitude?.toFixed(4)}, ${hr.longitude?.toFixed(4)}`,
              latitude: hr.latitude || 26.12,
              longitude: hr.longitude || 85.39,
              additionalInfo: hr.additional_info || 'Assistance requested.',
              managerInstructions: hr.status_note || 'Relief Manager assigned this incident for field assessment.',
              allocatedSupplies: { 'Emergency Ration Packs': 10, 'Clean Water': 20, 'First Aid Kits': 2 },
              transportMode: 'All-Terrain Vehicle / Raft',
              teamName: 'SAR Rapid Unit',
              teamSize: 5,
              gridCells: [],
              status: sarStatus,
              statusNote: hr.status_note,
              dispatchedAt: hr.created_at || new Date().toISOString(),
            });
          }
        }
      }

      if (missions.length > 0) return missions;
    } catch (e) {
      console.warn('fetchAssignedMissions fallback:', e);
    }

    // Default mock mission orders for testing & preview
    return [
      {
        id: 'MISSION-SAR-01',
        helpRequestId: 'REQ-101',
        title: 'Flood Extraction & Rations Mission',
        disasterType: 'Flood',
        requesterName: 'Rahul Sharma (Family of 6)',
        requesterPhone: '+91 9876543210',
        address: 'Sector 4, Low-lying riverbank zone, Muzaffarpur',
        latitude: 26.1215,
        longitude: 85.3912,
        additionalInfo: '4 adults and 2 children stranded on terrace due to rising water level. Need rescue boat & rations urgently.',
        managerInstructions: 'Dispatch via motorized rescue boat through western canal. Approach cautiously around submerged power poles.',
        allocatedSupplies: { 'Emergency Ration Packs': 20, 'Clean Drinking Water': 50, 'First Aid & Trauma Kits': 4, 'Life Jackets': 6 },
        transportMode: 'Motorized Rescue Raft / Boat',
        teamName: 'Rapid Response Alpha',
        teamSize: 5,
        gridCells: ['cell-1-2', 'cell-1-3'],
        status: 'preparing',
        statusNote: 'Manager authorized mission. Unit loading rations & life jackets.',
        dispatchedAt: new Date(Date.now() - 1200000).toISOString(),
        managerOrgName: 'NDRF Central Command',
      },
      {
        id: 'MISSION-SAR-02',
        helpRequestId: 'REQ-102',
        title: 'Critical Medical Evacuation',
        disasterType: 'Medical Emergency',
        requesterName: 'Anjali Das (for Elderly Patient)',
        requesterPhone: '+91 9811223344',
        address: 'Barpeta Primary Health Center road',
        latitude: 26.4920,
        longitude: 90.9140,
        additionalInfo: 'Elderly patient with oxygen cylinder shortage and acute respiratory distress. Road submerged.',
        managerInstructions: 'Urgent medical kit and mobile O2 concentrator loaded. Coordinate with local hospital triage.',
        allocatedSupplies: { 'Essential Medicines Pack': 5, 'First Aid & Trauma Kits': 3, 'Clean Drinking Water': 20 },
        transportMode: 'Helicopter / Aerial Airdrop',
        teamName: 'Medical Strike Charlie',
        teamSize: 5,
        gridCells: ['cell-2-3'],
        status: 'dispatched',
        statusNote: 'Aviation wing airborne. ETA ~15 minutes to coordinates.',
        dispatchedAt: new Date(Date.now() - 3600000).toISOString(),
        managerOrgName: 'State Disaster Response Authority',
      },
    ];
  },

  /**
   * 2. Update Mission Status (Preparing -> Dispatched -> Resolved)
   * This instantly updates Supabase and propagates to citizen & manager!
   */
  async updateMissionStatus(
    mission: SARMission,
    newStatus: SARMissionStatus,
    operativeNote?: string
  ): Promise<boolean> {
    try {
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      let generatedNote = '';

      if (newStatus === 'preparing') {
        generatedNote = operativeNote || `SAR Team ${mission.teamName} is preparing rescue equipment, supplies, and route logistics [${timestamp}].`;
      } else if (newStatus === 'dispatched') {
        generatedNote = operativeNote || `SAR Team ${mission.teamName} is DISPATCHED and actively en route via ${mission.transportMode} [${timestamp}].`;
      } else if (newStatus === 'resolved') {
        generatedNote = operativeNote || `SAR Mission RESOLVED. Victims safely evacuated and emergency supplies delivered [${timestamp}].`;
      }

      // 1. Update help_requests table if tied to a request
      if (mission.helpRequestId && !mission.helpRequestId.startsWith('REQ-')) {
        await supabase
          .from('help_requests')
          .update({
            status: newStatus === 'preparing' ? 'preparing' : newStatus === 'dispatched' ? 'dispatched' : 'resolved',
            status_note: generatedNote,
            updated_at: new Date().toISOString(),
          })
          .eq('id', mission.helpRequestId);
      }

      // 2. Update deployments table if deployment record exists
      if (mission.deploymentId) {
        const depStatus = newStatus === 'resolved' ? 'completed' : newStatus === 'dispatched' ? 'en_route' : 'preparing';
        await supabase
          .from('deployments')
          .update({
            status: depStatus,
            transport_notes: generatedNote,
            updated_at: new Date().toISOString(),
          })
          .eq('id', mission.deploymentId);
      }

      return true;
    } catch (e) {
      console.warn('updateMissionStatus warning:', e);
      return false;
    }
  },

  /**
   * 3. Calculate distance between coordinates in km (Haversine formula)
   */
  calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(2));
  },
};
