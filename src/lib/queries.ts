import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type {
  User, Branch, SeatInventory, MeetingRoom, Plan,
  Lead, LeadActivity, Task, SiteVisit, Membership,
  Booking, Invoice, Visitor, BlogPost, Testimonial,
} from "@/types";

// Strip passwordHash from server User type
type SafeUser = Omit<User, "passwordHash"> & { passwordHash?: never };

// ─── Auth ───────────────────────────────────────

export function useMe() {
  return useQuery<SafeUser | null>({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        return await api.get<SafeUser>("/api/auth/me");
      } catch (e: any) {
        if (e.status === 401) return null;
        throw e;
      }
    },
    staleTime: 5 * 60_000,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (creds: { email: string; password: string }) =>
      api.post<SafeUser>("/api/auth/login", creds),
    onSuccess: (user) => qc.setQueryData(["me"], user),
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; email: string; password: string; phone?: string }) =>
      api.post<SafeUser>("/api/auth/register", data),
    onSuccess: (user) => qc.setQueryData(["me"], user),
  });
}

export function useDemoLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      api.post<SafeUser>(`/api/auth/demo/${userId}`),
    onSuccess: (user) => qc.setQueryData(["me"], user),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/api/auth/logout"),
    onSuccess: () => {
      qc.setQueryData(["me"], null);
      qc.clear();
    },
  });
}

// ─── Public data ────────────────────────────────

export function useBranches() {
  return useQuery<Branch[]>({
    queryKey: ["branches"],
    queryFn: () => api.get("/api/branches"),
    staleTime: 60_000,
  });
}

type BranchDetail = Branch & { seatInventory: SeatInventory[]; meetingRooms: MeetingRoom[] };

export function useBranch(slug: string) {
  return useQuery<BranchDetail>({
    queryKey: ["branches", slug],
    queryFn: () => api.get(`/api/branches/${slug}`),
    staleTime: 60_000,
  });
}

export function usePlans() {
  return useQuery<Plan[]>({
    queryKey: ["plans"],
    queryFn: () => api.get("/api/plans"),
    staleTime: 60_000,
  });
}

export function useBlog() {
  return useQuery<BlogPost[]>({
    queryKey: ["blog"],
    queryFn: () => api.get("/api/blog"),
    staleTime: 60_000,
  });
}

export function useBlogPost(slug: string) {
  return useQuery<BlogPost>({
    queryKey: ["blog", slug],
    queryFn: () => api.get(`/api/blog/${slug}`),
    staleTime: 60_000,
  });
}

export function useTestimonials() {
  return useQuery<Testimonial[]>({
    queryKey: ["testimonials"],
    queryFn: () => api.get("/api/testimonials"),
    staleTime: 60_000,
  });
}

// ─── Public mutations ───────────────────────────

export function useCreateLead() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post<Lead>("/api/leads", data),
  });
}

export function useBookSiteVisit() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post<{ lead: Lead; visit: SiteVisit }>("/api/site-visits", data),
  });
}

// ─── Dashboard data ─────────────────────────────

export function useLeads() {
  return useQuery<Lead[]>({
    queryKey: ["dashboard", "leads"],
    queryFn: () => api.get("/api/dashboard/leads"),
  });
}

export function useLead(id: string) {
  return useQuery<Lead & { activities: LeadActivity[] }>({
    queryKey: ["dashboard", "leads", id],
    queryFn: () => api.get(`/api/dashboard/leads/${id}`),
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: { id: string } & Partial<Lead>) =>
      api.patch<Lead>(`/api/dashboard/leads/${id}`, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dashboard", "leads"] }),
  });
}

export function useTasks() {
  return useQuery<Task[]>({
    queryKey: ["dashboard", "tasks"],
    queryFn: () => api.get("/api/dashboard/tasks"),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: { id: string } & Partial<Task>) =>
      api.patch<Task>(`/api/dashboard/tasks/${id}`, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dashboard", "tasks"] }),
  });
}

export function useSiteVisits() {
  return useQuery<SiteVisit[]>({
    queryKey: ["dashboard", "site-visits"],
    queryFn: () => api.get("/api/dashboard/site-visits"),
  });
}

export function useMyMemberships() {
  return useQuery<Membership[]>({
    queryKey: ["dashboard", "me", "memberships"],
    queryFn: () => api.get("/api/dashboard/me/memberships"),
  });
}

export function useMyInvoices() {
  return useQuery<Invoice[]>({
    queryKey: ["dashboard", "me", "invoices"],
    queryFn: () => api.get("/api/dashboard/me/invoices"),
  });
}

export function useMyBookings() {
  return useQuery<Booking[]>({
    queryKey: ["dashboard", "me", "bookings"],
    queryFn: () => api.get("/api/dashboard/me/bookings"),
  });
}

export function useAllInvoices() {
  return useQuery<Invoice[]>({
    queryKey: ["dashboard", "invoices"],
    queryFn: () => api.get("/api/dashboard/invoices"),
  });
}

export function useUsers() {
  return useQuery<SafeUser[]>({
    queryKey: ["dashboard", "users"],
    queryFn: () => api.get("/api/dashboard/users"),
  });
}

export function useVisitors() {
  return useQuery<Visitor[]>({
    queryKey: ["dashboard", "visitors"],
    queryFn: () => api.get("/api/dashboard/visitors"),
  });
}

export function useAllBranches() {
  return useQuery<Branch[]>({
    queryKey: ["dashboard", "all-branches"],
    queryFn: () => api.get("/api/dashboard/all-branches"),
  });
}
