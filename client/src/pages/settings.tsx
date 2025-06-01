import { useState } from "react";
import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { SettingsSkeleton } from "@/components/skeletons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import Chatbot from "@/components/dashboard/chatbot";

interface URLData {
  id: number;
  url: string;
  totalNumbers: number;
  totalInsights: number;
  totalSentiment: string;
  totalClassified: string;
  date: string;
  status: "SUCCESS" | "FAILED" | "PENDING";
}

export default function Settings() {
  const [newUrl, setNewUrl] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['/api/settings/urls', page],
    queryFn: async () => {
      // This would normally be fetched from the API
      return new Promise<{
        urls: URLData[];
        total: number;
      }>((resolve) => {
        setTimeout(() => {
          resolve({
            urls: [
              {
                id: 1,
                url: "http://15.235.147.1:4000/api/companies",
                totalNumbers: 5,
                totalInsights: 500,
                totalSentiment: "500/500",
                totalClassified: "500/500",
                date: "2025-04-10 08:41:52",
                status: "SUCCESS",
              },
              {
                id: 2,
                url: "http://15.235.147.1:4000/api/feedback",
                totalNumbers: 8,
                totalInsights: 750,
                totalSentiment: "750/750",
                totalClassified: "750/750",
                date: "2025-05-12 10:23:45",
                status: "SUCCESS",
              },
              {
                id: 3,
                url: "http://15.235.147.1:4000/api/survey",
                totalNumbers: 12,
                totalInsights: 320,
                totalSentiment: "320/320",
                totalClassified: "320/320",
                date: "2025-05-14 09:15:30",
                status: "SUCCESS",
              },
            ],
            total: 10,
          });
        }, 500);
      });
    },
  });

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;

    console.log("Adding URL:", newUrl);
    // In a real app, we would call API to add the URL
    setNewUrl("");
  };

  const handleEditUrl = (id: number) => {
    console.log("Editing URL with ID:", id);
    // In a real app, we would open a modal or navigate to edit page
  };

  const handleDeleteUrl = (id: number) => {
    console.log("Deleting URL with ID:", id);
    // In a real app, we would call API to delete the URL
  };

  if (isLoading) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="flex-1 overflow-x-hidden">
      <Header title="Settings" showFilters={false} />

      <div className="p-6">
        <Card className="mb-6 shadow-[0_10px_20px_rgba(0,0,0,0.05)]">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Settings</h2>

            <h3 className="text-md font-medium mb-3">Tambah Sumber Baru</h3>
            <form className="flex gap-2 mb-6" onSubmit={handleAddUrl}>
              <Input
                placeholder="Ketik URL sumber disini..."
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="flex-1"
              />
              <Button type="submit">Submit</Button>
            </form>

            <h3 className="text-md font-medium mb-3">Daftar Sumber</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">No</TableHead>
                    <TableHead>URL Sumber</TableHead>
                    <TableHead>Total Sumber</TableHead>
                    <TableHead>Total Insight</TableHead>
                    <TableHead>Total Sentiment</TableHead>
                    <TableHead>Total Klasifikasi</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.urls.map((url, index) => (
                    <TableRow key={url.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="max-w-xs truncate">{url.url}</TableCell>
                      <TableCell>{url.totalNumbers}</TableCell>
                      <TableCell>{url.totalInsights}</TableCell>
                      <TableCell>{url.totalSentiment}</TableCell>
                      <TableCell>{url.totalClassified}</TableCell>
                      <TableCell>{url.date}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          url.status === "SUCCESS"
                            ? "bg-green-100 text-green-800"
                            : url.status === "FAILED"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {url.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleEditUrl(url.id)}
                          >
                            <Pencil className="h-4 w-4 text-blue-500" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleDeleteUrl(url.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (page > 1) setPage(page - 1);
                      }}
                      className={page === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      isActive={page === 1}
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(1);
                      }}
                    >
                      1
                    </PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (page < Math.ceil((data?.total || 0) / 10)) setPage(page + 1);
                      }}
                      className={page >= Math.ceil((data?.total || 0) / 10) ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>

              <div className="text-sm text-gray-500">
                Menampilkan 1 sampai 10 dari 10 entri
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Chatbot />
    </div>
  );
}
