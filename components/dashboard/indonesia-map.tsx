import React, { useLayoutEffect, useRef } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5map from '@amcharts/amcharts5/map';
import am5geodata_indonesiaLow from '@amcharts/amcharts5-geodata/indonesiaLow';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';

interface RegionData {
  id: string;
  name: string;
  value: number;
  positif_percentage?: number;
  negatif_percentage?: number;
  netral_percentage?: number;
  kotaCount?: number;
  allCities?: string;
  dominantSentiment?: string;
}

interface IndonesiaMapProps {
  data?: RegionData[];
  title?: string;
  width?: string;
  height?: string;
}

const IndonesiaMap: React.FC<IndonesiaMapProps> = ({
  data = [],
  title = "Regional Insights",
  width = '100%',
  height = '400px'
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<am5.Root | null>(null);

  useLayoutEffect(() => {
    // Initialize chart only when DOM is ready
    if (!chartRef.current) return;

    // Dispose previous chart if exists
    if (rootRef.current) {
      rootRef.current.dispose();
    }

    // Create root element
    const root = am5.Root.new(chartRef.current);
    rootRef.current = root;

    // Set themes
    root.setThemes([am5themes_Animated.new(root)]);

    // Create the map chart
    const chart = root.container.children.push(
      am5map.MapChart.new(root, {
        panX: "translateX",
        panY: "translateY",
        projection: am5map.geoMercator(),
        homeZoomLevel: 2,
        homeGeoPoint: { longitude: 118, latitude: -2 }
      })
    );

    // Create polygon series for map
    const polygonSeries = chart.series.push(
      am5map.MapPolygonSeries.new(root, {
        geoJSON: am5geodata_indonesiaLow,
        valueField: "value",
        calculateAggregates: true
      })
    );

    // Configure polygon series appearance
    polygonSeries.mapPolygons.template.setAll({
      tooltipText: "{name}: {value} insights\nPositive: {positif_percentage}% | Negative: {negatif_percentage}% | Neutral: {netral_percentage}%\nDominant: {dominantSentiment}\nCities: {allCities}",
      interactive: true,
      fill: am5.color(0xEEEEEE),
      strokeWidth: 0.5,
      stroke: am5.color(0xFFFFFF)
    });



    // Create hover state
    const hoverState = polygonSeries.mapPolygons.template.states.create("hover", {
      fill: am5.color(0x0984E3)
    });

    // Create active state
    const activeState = polygonSeries.mapPolygons.template.states.create("active", {
      fill: am5.color(0x00B894)
    });

    // Remove heat rules and use direct fill assignment based on sentiment
    // This ensures each region gets the exact color based on its dominant sentiment

    // Add adapter to handle sentiment-based coloring
    polygonSeries.mapPolygons.template.adapters.add("fill", (fill, target) => {
      const dataItem = target.dataItem;
      if (dataItem && dataItem.dataContext) {
        const data = dataItem.dataContext as any;

        // Use dominantSentiment to determine color
        switch (data.dominantSentiment) {
          case 'positive':
            return am5.color(0x28A745); // Green for positive
          case 'negative':
            return am5.color(0xDC3545); // Red for negative
          case 'neutral':
            return am5.color(0xFFC107); // Yellow for neutral
          default:
            return am5.color(0xEEEEEE); // Default gray for no data
        }
      }
      return am5.color(0xEEEEEE); // Default gray
    });

    // Add events to polygons
    polygonSeries.mapPolygons.template.events.on("click", (ev) => {
      const dataItem = ev.target.dataItem;

      if (dataItem && dataItem.dataContext) {
        const dataContext = dataItem.dataContext as any;
        const id = dataContext.id;
        const name = dataContext.name;
        const value = dataContext.value;

        if (id && name) {
          console.log(`Clicked region: ${name} (${id}), value: ${value}`);
          // Handle click event here (e.g., filter data by region)
        }
      }

      // Toggle active state
      polygonSeries.mapPolygons.each((polygon) => {
        if (polygon !== ev.target) {
          polygon.states.applyAnimate("default");
        }
      });

      if (ev.target.get("active")) {
        ev.target.states.applyAnimate("default");
        ev.target.set("active", false);
      } else {
        ev.target.states.applyAnimate("active");
        ev.target.set("active", true);
      }
    });

    // Create a legend if there's data
    if (data.length > 0) {
      // Set up data for regions - simplified since we use adapter for coloring
      const regionData = data.map(region => ({
        id: region.id,
        name: region.name,
        value: region.value,
        positif_percentage: region.positif_percentage || 0,
        negatif_percentage: region.negatif_percentage || 0,
        netral_percentage: region.netral_percentage || 0,
        kotaCount: region.kotaCount || 0,
        allCities: region.allCities || region.name,
        dominantSentiment: region.dominantSentiment || 'neutral'
      }));

      polygonSeries.data.setAll(regionData);



      // Add sentiment legend
      const legend = chart.children.push(am5.Legend.new(root, {
        centerX: am5.percent(50),
        x: am5.percent(50),
        y: am5.percent(90),
        layout: root.horizontalLayout
      }));

      // Add legend items for sentiment colors
      legend.data.setAll([
        {
          name: "Positive",
          color: am5.color(0x28A745)
        },
        {
          name: "Negative",
          color: am5.color(0xDC3545)
        },
        {
          name: "Neutral",
          color: am5.color(0xFFC107)
        }
      ]);

      // Style legend labels
      legend.labels.template.setAll({
        fontSize: 12,
        fontWeight: "400"
      });

      // Style legend markers
      legend.markers.template.setAll({
        width: 12,
        height: 12
      });
    } else {
      // Default data with minimal values
      const defaultData = [
        { id: "ID-JK", name: "Jakarta", value: 42 },
        { id: "ID-JB", name: "West Java", value: 35 },
        { id: "ID-JI", name: "East Java", value: 28 },
        { id: "ID-JT", name: "Central Java", value: 25 },
        { id: "ID-SN", name: "South Sulawesi", value: 18 },
        { id: "ID-BT", name: "Banten", value: 15 },
        { id: "ID-SU", name: "North Sumatra", value: 12 },
        { id: "ID-KT", name: "East Kalimantan", value: 10 }
      ];

      polygonSeries.data.setAll(defaultData);
    }

    // Make stuff animate on load
    chart.appear(1000, 100);

    return () => {
      // Clean up on unmount
      if (rootRef.current) {
        rootRef.current.dispose();
      }
    };
  }, [data]);

  return (
    <div className="rounded-xl bg-white shadow-[0_10px_20px_rgba(0,0,0,0.05)] overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-medium text-gray-800">{title}</h3>
      </div>
      <div ref={chartRef} style={{ width, height }} />
    </div>
  );
};

export default IndonesiaMap;