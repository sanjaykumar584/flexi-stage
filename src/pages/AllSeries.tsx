import { useEffect, useMemo } from "react";
import { useLocation, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Series } from "@/lib/mockApi";

// Page to display all series passed from Index via navigation state
// Expects: location.state = { series: Series[], title?: string }
const AllSeries = () => {
  const location = useLocation();
  const state = location.state as { series?: Series[]; title?: string } | null;

  const series: Series[] = useMemo(() => state?.series ?? [], [state]);
  const title = state?.title ?? "All Series";

  // Basic SEO and structured data without external libs
  useEffect(() => {
    document.title = `${title} – Browse Series`;

    const ensureMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name='${name}']`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    ensureMeta(
      "description",
      series.length
        ? `Explore ${series.length} series in ${title}.`
        : `Explore all series.`
    );

    // Canonical
    let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", window.location.href);

    // JSON-LD ItemList
    const ldJson = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: title,
      numberOfItems: series.length,
      itemListElement: series.map((s, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "CreativeWork",
          name: s.title || `Series ${i + 1}`,
          image: s.mediaUrl || undefined,
        },
      })),
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(ldJson);
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, [series, title]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-gradient-to-b from-primary/10 to-background">
        <div className="container py-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">All Series</h1>
              <p className="text-muted-foreground">{title} • {series.length} items</p>
            </div>
            <Button asChild variant="secondary">
              <Link to="/">Back</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {series.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No series data was passed. Please navigate from the "All Series" component on the homepage.
            </CardContent>
          </Card>
        ) : (
          <section aria-labelledby="series-grid-heading">
            <h2 id="series-grid-heading" className="sr-only">Series grid</h2>
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {series.map((s, idx) => (
                <li key={s.id ?? idx}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                    {s.mediaUrl ? (
                      <img
                        src={s.mediaUrl}
                        alt={s.title ? `${s.title} thumbnail` : `Series ${idx + 1} thumbnail`}
                        className="aspect-[3/4] w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="aspect-[3/4] w-full bg-muted" />
                    )}
                    <CardHeader className="p-3">
                      <CardTitle className="text-sm font-medium truncate">
                        {s.title || `Series ${idx + 1}`}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
};

export default AllSeries;
