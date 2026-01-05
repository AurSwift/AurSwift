import { ipcRenderer } from "electron";

export interface TerminalUpdateData {
  name?: string;
  type?: "pos" | "kiosk" | "handheld" | "kitchen_display" | "server";
  status?: "active" | "inactive" | "maintenance" | "decommissioned";
  deviceToken?: string;
  ipAddress?: string;
  macAddress?: string;
  settings?: any;
}

export interface NetworkInfo {
  localIP: string;
  macAddress: string;
}

export const terminalsAPI = {
  getByBusiness: (sessionToken: string, businessId: string) =>
    ipcRenderer.invoke("terminals:getByBusiness", sessionToken, businessId),

  getById: (sessionToken: string, terminalId: string) =>
    ipcRenderer.invoke("terminals:getById", sessionToken, terminalId),

  update: (
    sessionToken: string,
    terminalId: string,
    updates: TerminalUpdateData
  ) =>
    ipcRenderer.invoke("terminals:update", sessionToken, terminalId, updates),

  getNetworkInfo: (): Promise<{
    success: boolean;
    data?: NetworkInfo;
    message?: string;
  }> => ipcRenderer.invoke("terminals:getNetworkInfo"),
};
