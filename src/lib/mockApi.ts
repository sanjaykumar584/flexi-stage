import axios from "axios";

export type Section = {
  id: string;
  name: string;
};

export type Series = {
  id: string;
  title?: string;
  mediaUrl?: string;
};

export type ComponentItem = {
  id: string;
  name: string;
  sectionId: string;
  series: Series[];
};

let sections: Section[] = [];

const componentsBySection: Record<string, ComponentItem[]> = {};

// Fallback demo data (used when API fails or is unreachable)
const fallbackSections: Section[] = [
  { id: "singing", name: "Singing" },
  { id: "acting", name: "Acting" },
];

const fallbackComponents: Record<string, ComponentItem[]> = {
  singing: [
    {
      id: "vocals",
      name: "Vocal Warmups",
      sectionId: "singing",
      series: [
        { id: "vw-1", title: "Lip Trills", mediaUrl: "/placeholder.svg" },
        { id: "vw-2", title: "Humming Scales", mediaUrl: "/placeholder.svg" },
        { id: "vw-3", title: "Sirens", mediaUrl: "/placeholder.svg" },
      ],
    },
    {
      id: "breathing",
      name: "Breathing Exercises",
      sectionId: "singing",
      series: [
        { id: "be-1", title: "Box Breathing", mediaUrl: "/placeholder.svg" },
        { id: "be-2", title: "Diaphragmatic", mediaUrl: "/placeholder.svg" },
        { id: "be-3", title: "Sustained Notes", mediaUrl: "/placeholder.svg" },
      ],
    },
  ],
  acting: [
    {
      id: "method",
      name: "Method Acting Basics",
      sectionId: "acting",
      series: [
        { id: "ma-1", title: "Sense Memory", mediaUrl: "/placeholder.svg" },
        { id: "ma-2", title: "Emotional Recall", mediaUrl: "/placeholder.svg" },
      ],
    },
    {
      id: "scenes",
      name: "Scene Study",
      sectionId: "acting",
      series: [
        { id: "ss-1", title: "Beat Breakdown", mediaUrl: "/placeholder.svg" },
        { id: "ss-2", title: "Objective & Obstacle", mediaUrl: "/placeholder.svg" },
      ],
    },
  ],
};

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function fetchSections(): Promise<Section[]> {
  sections = [];
  try {
    const token = import.meta.env.VITE_AUTH_TOKEN;
    const res = await axios.get(import.meta.env.VITE_HEADER_API,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "accept": "application/json, text/plain, /",
        },
      }
    );
    const resData = res.data.data;
    const tabs = resData.tabs;

    // console.log("Response from API:", resData);
    // console.log("Tabs:", tabs);

    tabs.forEach((tab: any) => {
      if (tab.pageId) {
        const sectionData: Section = {
          id: tab.pageId,
          name: tab.name,
        };
        sections.push(sectionData);
      }
    });

    // console.log("Sections:", sections);
  } catch (error) {
    console.warn("Falling back to demo sections due to fetch error:", error);
    sections = [...fallbackSections];
  }
  return sections;
}

export async function fetchComponentsBySection(
  sectionId: string
): Promise<ComponentItem[]> {
  // console.log("Fetching components for section:", sectionId);
  try {
    const token = import.meta.env.VITE_AUTH_TOKEN;
    const res = await axios.get(import.meta.env.VITE_PAGE_API + sectionId,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "accept": "application/json, text/plain, /",
      },
    }
  );
  
    const resData = res.data;
    const section = resData.data;
    const componenents = section.components;
    
    // console.log("Section id:", section._id);
    console.log("Response from API:", componenents);

    componentsBySection[sectionId] = [];
    for (const component of componenents) {
      const compData = {
      id: component._id,
      name: component.title ? component.title : component.componentKey,
      sectionId: sectionId,
      series: []
      }
      componentsBySection[compData.sectionId].push(compData);

      // console.log("Component data:", component);

      if (component.componentKey == 'single-ad-banner' || component.componentKey == 'full-size-banner') {
        const seriesData = {
          id: component._id,
          mediaUrl:  component.media.mediaUrl
        }
        compData.series.push(seriesData);
      }
      if (component.componentKey == 'learn-action-button') {
        for (let i = 0; i < component.interactionData.items.length; i++) {
          const item = component.interactionData.items[i];
          const itemData = {
            id: String(i), 
            mediaUrl: item.button.media[0].mediaUrl
          };
        compData.series.push(itemData);
        }
      }
      if (component.componentKey == 'course-series-card' ||
        component.componentKey == 'continue-watching' ||
        component.componentKey == 'upcoming-series-card') {
        for (let i = 0; i < component.actionData.length; i++) { 
          const item = {
            id: component.actionData[i].taskDetail._id,
            mediaUrl: component.actionData[i].thumbnail,
          } 
        compData.series.push(item);
        }
      }
      if (component.componentKey == 'advertisement-feature-banner') {
        for (const item of component.media) {
          const itemData = {
            id: item.mediaId,
            mediaUrl: item.mediaUrl,
          }
          compData.series.push(itemData);
        }
      }

    }
    console.log("Components by section:", componentsBySection);
  
  } catch (error) {
    console.warn("Falling back to demo components due to fetch error:", error);
    componentsBySection[sectionId] = fallbackComponents[sectionId] ?? fallbackComponents["singing"] ?? [];
  }

  return JSON.parse(
    JSON.stringify(componentsBySection[sectionId] ?? [])
  ) as ComponentItem[];
}

export async function submitOrder(sectionId: string, compData: ComponentItem[]) {
  try {
    const payload = {
      components: compData.map((item) => ({
        componentId: {
          $oid: item.id
        }
      }))
    };
    
    const token = import.meta.env.VITE_AUTH_TOKEN;
    const res = await axios.post(import.meta.env.VITE_UPDATE_COMP + sectionId,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "accept": "application/json, text/plain, /",
        },
      }
    );
    
    console.log("Submitting order for section:", sectionId, payload);
    console.log("Response from order submission:", res.data);
  } catch (error) {
    console.error("Error processing components:", error);
    throw error;
  }
}

