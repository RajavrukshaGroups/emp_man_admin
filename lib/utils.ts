import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]): string => {
    return twMerge(clsx(inputs));
};

export const formatDate = (
    date: string | Date | null | undefined,
): string => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return "—";
    }

    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(parsedDate);
};

export const formatDateTime = (
    date: string | Date | null | undefined,
): string => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return "—";
    }

    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(parsedDate);
};

export const getInitials = (
    firstName?: string,
    lastName?: string,
): string => {
    const firstInitial = firstName?.trim().charAt(0) ?? "";
    const lastInitial = lastName?.trim().charAt(0) ?? "";

    return `${firstInitial}${lastInitial}`.toUpperCase() || "U";
};

export const humanizeText = (value: string): string => {
    return value
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (character) => character.toUpperCase());
};