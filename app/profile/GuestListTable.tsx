"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/Button";
import Table, { TableRow, TableCell } from "@/components/Table";
import type { GuestListFile } from "@/types";

interface GuestListTableProps {
  files: GuestListFile[];
  onDelete: (fileId: string, storagePath: string | null) => void;
  formatFileSize: (bytes: number) => string;
}

export default function GuestListTable({
  files,
  onDelete,
  formatFileSize,
}: GuestListTableProps) {
  const [eventNames, setEventNames] = useState<Record<string, string>>({});
  const supabase = createClient();

  useEffect(() => {
    const loadEventNames = async () => {
      const eventIds = files
        .map((f) => f.event_id)
        .filter((id): id is string => id !== null);
      if (eventIds.length === 0) return;

      try {
        const { data, error } = await supabase
          .from("events")
          .select("id, title")
          .in("id", eventIds);

        if (error) throw error;

        const names: Record<string, string> = {};
        data?.forEach((event) => {
          names[event.id] = event.title;
        });
        setEventNames(names);
      } catch (err) {
        console.error("Error loading event names:", err);
      }
    };

    loadEventNames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  return (
    <Table
      headers={[
        "File Name",
        "Event",
        "Guest Count",
        "File Size",
        "Uploaded",
        "Actions",
      ]}
    >
      {files.map((file) => (
        <TableRow key={file.id}>
          <TableCell>{file.file_name}</TableCell>
          <TableCell>
            {file.event_id
              ? eventNames[file.event_id] || "Loading..."
              : "No event"}
          </TableCell>
          <TableCell>{file.guest_count}</TableCell>
          <TableCell>{formatFileSize(file.file_size)}</TableCell>
          <TableCell>
            {new Date(file.created_at).toLocaleDateString()}
          </TableCell>
          <TableCell>
            <Button
              variant="danger"
              onClick={() => onDelete(file.id, file.storage_path)}
              className="text-sm"
            >
              Delete
            </Button>
          </TableCell>
        </TableRow>
      ))}
    </Table>
  );
}
