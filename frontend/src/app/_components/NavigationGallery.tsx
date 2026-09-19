"use client";

import { useState } from "react";
import { Breadcrumbs, IconButton, Menu, Pagination, SegmentedControl, Tabs } from "@/components/ui";

/**
 * Reproduces components/navigation/navigation.card.html's demo
 * (context/current-feature.md, Frontend 2g).
 */
export function NavigationGallery() {
  const [tab, setTab] = useState("open");
  const [range, setRange] = useState("Month");
  const [currency, setCurrency] = useState("USDC");
  const [page, setPage] = useState(3);

  return (
    <>
      <Tabs
        items={[
          { value: "open", label: "Open circles", count: 14 },
          { value: "mine", label: "My circles", count: 3 },
          { value: "done", label: "Completed", count: 6 },
        ]}
        value={tab}
        onChange={setTab}
      />

      <section className="flex flex-wrap items-center gap-2.5">
        <SegmentedControl options={["Month", "Quarter", "Year"]} value={range} onChange={setRange} />
        <SegmentedControl size="sm" options={["USDC", "DAI"]} value={currency} onChange={setCurrency} />
      </section>

      <Breadcrumbs
        items={[{ label: "Circles", href: "#" }, { label: "Tehran Freelancers", href: "#" }, { label: "Round 4" }]}
      />

      <section className="flex flex-wrap items-center gap-2.5">
        <Pagination page={page} count={14} onChange={setPage} />
        <Menu
          trigger={<IconButton icon="more-vertical" variant="outline" label="More" />}
          items={[{ label: "Leave circle", icon: "log-out" }, { divider: true }, { label: "Report an issue", icon: "flag", danger: true }]}
        />
      </section>
    </>
  );
}
