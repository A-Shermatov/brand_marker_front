import { keepPreviousData, useQuery } from "@tanstack/react-query"
import {
  adminApi,
  type AdminDeviceParams,
  type AdminEntityLogParams,
  type AdminLogParams,
} from "@/lib/api/admin"

export const adminLogKeys = {
  all: ["admin-logs"] as const,
  list: (params: AdminLogParams) => [...adminLogKeys.all, "list", params] as const,
  detail: (logId: number) => [...adminLogKeys.all, "detail", logId] as const,
  entity: (params: AdminEntityLogParams) => [...adminLogKeys.all, "entity", params] as const,
  devices: (params: AdminDeviceParams) => [...adminLogKeys.all, "devices", params] as const,
  device: (deviceKey: string) => [...adminLogKeys.all, "device", deviceKey] as const,
}

export const useAdminLogsQuery = (params: AdminLogParams) =>
  useQuery({
    queryKey: adminLogKeys.list(params),
    queryFn: () => adminApi.getLogs(params),
    placeholderData: keepPreviousData,
  })

export const useAdminLogQuery = (logId: number | null) =>
  useQuery({
    queryKey: adminLogKeys.detail(logId ?? 0),
    queryFn: () => adminApi.getLog(logId as number),
    enabled: Boolean(logId),
  })

export const useAdminEntityLogsQuery = (params: AdminEntityLogParams, enabled = true) =>
  useQuery({
    queryKey: adminLogKeys.entity(params),
    queryFn: () => adminApi.getEntityLogs(params),
    placeholderData: keepPreviousData,
    enabled: enabled && Boolean(params.resourceType) && String(params.resourceId) !== "",
  })

export const useAdminDevicesQuery = (params: AdminDeviceParams, enabled = true) =>
  useQuery({
    queryKey: adminLogKeys.devices(params),
    queryFn: () => adminApi.getDevices(params),
    placeholderData: keepPreviousData,
    enabled,
  })

export const useAdminDeviceQuery = (deviceKey: string | null) =>
  useQuery({
    queryKey: adminLogKeys.device(deviceKey ?? ""),
    queryFn: () => adminApi.getDevice(deviceKey as string),
    enabled: Boolean(deviceKey),
  })
