"use client";

import { Eye, Edit2, Trash2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ActionIconsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  size?: number;
}

export function ActionIcons({
  onView,
  onEdit,
  onDelete,
  size = 18,
}: ActionIconsProps) {
  return (
    <TooltipProvider>
      <div className="flex gap-3 items-center">
        {onView && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onView}
                className="p-1 rounded hover:bg-blue-100 transition-colors"
              >
                <Eye size={size} className="text-blue-600" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">عرض</TooltipContent>
          </Tooltip>
        )}

        {onEdit && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onEdit}
                className="p-1 rounded hover:bg-amber-100 transition-colors"
              >
                <Edit2 size={size} className="text-amber-600" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">تعديل</TooltipContent>
          </Tooltip>
        )}

        {onDelete && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onDelete}
                className="p-1 rounded hover:bg-red-100 transition-colors"
              >
                <Trash2 size={size} className="text-red-600" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">حذف</TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
