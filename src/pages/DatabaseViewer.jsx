import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import TopBar from "../components/admin/TopBar";
import { Database, Table as TableIcon, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const TABLES = [
  "teams",
  "startups",
  "users",
  "bids",
  "power_cards",
  "activity_logs",
  "news",
  "auction_settings",
];

export default function DatabaseViewer() {
  const [activeTable, setActiveTable] = useState(TABLES[0]);

  // Fetch settings for TopBar (mocking activeStartup, teamsOnline, totalBids since we don't need them all purely for TopBar unless TopBar requires them to be exact. TopBar handles its own if not passed perfectly, but we'll try to keep it clean)
  const { data: settingsData } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data } = await supabase.from('auction_settings').select('*').limit(1).single();
      return data || {};
    }
  });

  const { data: tableData, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["db_table", activeTable],
    queryFn: async () => {
      const sortColumn = ['teams', 'startups', 'bids', 'news', 'auction_settings', 'activity_logs'].includes(activeTable) ? 'created_date' : 'created_at';
      const { data, error } = await supabase.from(activeTable).select('*').order(sortColumn, { ascending: false, nullsFirst: false }).limit(500);
      if (error) {
        // sometimes tables don't have created_date/created_at, fallback to no order
        const { data: fallbackData, error: fallbackError } = await supabase.from(activeTable).select('*').limit(500);
        if (fallbackError) throw fallbackError;
        return fallbackData || [];
      }
      return data || [];
    },
    refetchInterval: 10000,
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar 
        settings={settingsData || {}}
        activeStartup={null}
        teamsOnline={0}
        totalBids={0}
      />

      <main className="flex-1 overflow-auto p-6 bg-[#050814]">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Database className="w-6 h-6 text-[#4F91CD]" />
              Database Viewer
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Raw view of Supabase tables (limited to 500 rows)
            </p>
          </div>
          <Button
            onClick={() => refetch()}
            disabled={isFetching}
            className="bg-[#19388A] hover:bg-[#19388A]/80 text-white flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>

        <div className="flex gap-6 h-[calc(100vh-180px)]">
          {/* Sidebar - Tables List */}
          <div className="w-64 bg-[#0F1629] border border-[#19388A]/30 rounded-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[#19388A]/30 bg-[#0B1020]">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <TableIcon className="w-4 h-4 text-gray-400" />
                Tables
              </h2>
            </div>
            <div className="overflow-y-auto flex-1 p-2">
              <div className="space-y-1">
                {TABLES.map(tableName => (
                  <button
                    key={tableName}
                    onClick={() => setActiveTable(tableName)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2
                      ${activeTable === tableName 
                        ? 'bg-[#19388A]/40 text-white font-medium border border-[#19388A]/50' 
                        : 'text-gray-400 hover:text-white hover:bg-[#19388A]/10 border border-transparent'
                      }
                    `}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${activeTable === tableName ? 'bg-[#4F91CD]' : 'bg-transparent'}`} />
                    {tableName}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content - Table Data */}
          <div className="flex-1 bg-[#0F1629] border border-[#19388A]/30 rounded-xl overflow-hidden flex flex-col">
            {/* Table Header */}
            <div className="p-4 border-b border-[#19388A]/30 bg-[#0B1020] flex justify-between items-center">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-[#4F91CD]">/</span>
                {activeTable}
              </h2>
              <Badge className="bg-[#19388A]/40 text-[#4F91CD] border-[#19388A]/50">
                {tableData?.length || 0} rows
              </Badge>
            </div>

            {/* Table Body / Content */}
            <div className="flex-1 overflow-auto p-4 custom-scrollbar">
              {isLoading ? (
                <div className="flex justify-center items-center h-full text-gray-500">
                  <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                  Loading data...
                </div>
              ) : error ? (
                <div className="flex flex-col justify-center items-center h-full text-red-400">
                  <AlertCircle className="w-10 h-10 mb-2 opacity-80" />
                  <span className="font-semibold">Error loading table</span>
                  <span className="text-sm opacity-70 mt-1">{error.message}</span>
                </div>
              ) : tableData && tableData.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-[#19388A]/20">
                  <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                    <thead>
                      <tr className="bg-[#0B1020] border-b border-[#19388A]/30 text-xs text-gray-400 uppercase tracking-wider">
                        {Object.keys(tableData[0]).map((key) => (
                          <th key={key} className="px-4 py-3 font-medium">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#19388A]/10">
                      {tableData.map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-[#19388A]/10 transition-colors">
                          {Object.values(row).map((value, colIndex) => (
                            <td key={colIndex} className="px-4 py-3 text-gray-300">
                              {value === null ? (
                                <span className="text-gray-600 italic">null</span>
                              ) : typeof value === 'object' ? (
                                <span className="text-[#4F91CD] font-mono text-xs">{JSON.stringify(value)}</span>
                              ) : typeof value === 'boolean' ? (
                                <span className={value ? "text-lime-400" : "text-red-400"}>{value.toString()}</span>
                              ) : (
                                <span className="font-mono text-xs">{String(value)}</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex justify-center items-center h-full text-gray-500">
                  No data found in "{activeTable}"
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
