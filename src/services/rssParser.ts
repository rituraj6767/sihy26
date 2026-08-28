export interface DisasterAlert {
  guid: string;
  title: string;
  description: string;
  author: string;
  pubDate: string;
  link: string;
  category: string;
  eventType?: string;
  severity?: 'Extreme' | 'Severe' | 'Moderate' | 'Minor' | 'Unknown';
  urgency?: string;
  areaDesc?: string;
  latitude?: number;
  longitude?: number;
  extractedState?: string;
}

// Simple XML tag extractor using regex for fast, reliable RN compatibility
function extractTag(xml: string, tag: string): string {
  const regex = new RegExp(`<(?:cap:)?${tag}[^>]*>([\\s\\S]*?)<\\/(?:cap:)?${tag}>`, 'i');
  const match = xml.match(regex);
  if (!match) return '';
  return match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
}

export function parseRssXml(rssXml: string): DisasterAlert[] {
  const items: DisasterAlert[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(rssXml)) !== null) {
    const itemXml = match[1];
    const title = extractTag(itemXml, 'title');
    const description = extractTag(itemXml, 'description');
    const link = extractTag(itemXml, 'link');
    const author = extractTag(itemXml, 'author');
    const guid = extractTag(itemXml, 'guid') || link;
    const pubDate = extractTag(itemXml, 'pubDate');
    const category = extractTag(itemXml, 'category') || 'Disaster';

    if (title || link) {
      items.push({
        guid,
        title,
        description,
        author,
        pubDate,
        link,
        category,
      });
    }
  }

  return items;
}

export function parseCapXmlDetails(capXml: string): Partial<DisasterAlert> {
  const eventType = extractTag(capXml, 'event') || extractTag(capXml, 'category');
  const severityRaw = extractTag(capXml, 'severity');
  const urgency = extractTag(capXml, 'urgency');
  const areaDesc = extractTag(capXml, 'areaDesc');
  const altitude = extractTag(capXml, 'altitude');
  const ceiling = extractTag(capXml, 'ceiling');

  let latitude: number | undefined;
  let longitude: number | undefined;

  const latNum = parseFloat(altitude);
  const lonNum = parseFloat(ceiling);

  if (!isNaN(latNum) && !isNaN(lonNum) && latNum > 5 && latNum < 40 && lonNum > 65 && lonNum < 100) {
    latitude = latNum;
    longitude = lonNum;
  }

  let severity: DisasterAlert['severity'] = 'Moderate';
  if (/extreme/i.test(severityRaw)) severity = 'Extreme';
  else if (/severe/i.test(severityRaw)) severity = 'Severe';
  else if (/minor/i.test(severityRaw)) severity = 'Minor';
  else if (/moderate/i.test(severityRaw)) severity = 'Moderate';

  return {
    eventType,
    severity,
    urgency,
    areaDesc,
    latitude,
    longitude,
  };
}
