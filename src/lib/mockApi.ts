export type Section = {
  id: string;
  name: string;
};

export type Series = {
  id: string;
  title: string;
};

export type ComponentItem = {
  id: string;
  name: string;
  sectionId: string;
  series: Series[];
};

const sections: Section[] = [
  { id: "singing", name: "Singing" },
  { id: "acting", name: "Acting" },
];

const componentsBySection: Record<string, ComponentItem[]> = {
  singing: [
    {
      id: "vocals",
      name: "Vocal Warmups",
      sectionId: "singing",
      series: [
        { id: "vw-1", title: "Lip Trills" },
        { id: "vw-2", title: "Humming Scales" },
        { id: "vw-3", title: "Sirens" },
      ],
    },
    {
      id: "breathing",
      name: "Breathing Exercises",
      sectionId: "singing",
      series: [
        { id: "be-1", title: "Box Breathing" },
        { id: "be-2", title: "Diaphragmatic Breathing" },
        { id: "be-3", title: "Sustained Notes" },
      ],
    },
    {
      id: "pitch",
      name: "Pitch Training",
      sectionId: "singing",
      series: [
        { id: "pt-1", title: "Intervals" },
        { id: "pt-2", title: "Arpeggios" },
      ],
    },
  ],
  acting: [
    {
      id: "method",
      name: "Method Acting Basics",
      sectionId: "acting",
      series: [
        { id: "ma-1", title: "Sense Memory" },
        { id: "ma-2", title: "Emotional Recall" },
      ],
    },
    {
      id: "scenes",
      name: "Scene Study",
      sectionId: "acting",
      series: [
        { id: "ss-1", title: "Beat Breakdown" },
        { id: "ss-2", title: "Objective & Obstacle" },
        { id: "ss-3", title: "Tactics" },
      ],
    },
  ],
};

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function fetchSections(): Promise<Section[]> {
  await delay(300);
  return sections;
}

export async function fetchComponentsBySection(
  sectionId: string
): Promise<ComponentItem[]> {
  await delay(500);
  // deep clone to avoid accidental mutations of source
  return JSON.parse(
    JSON.stringify(componentsBySection[sectionId] ?? [])
  ) as ComponentItem[];
}
