/**
 * Network Information Utility
 * Provides network-related information for terminal configuration
 */

import { networkInterfaces } from "os";
import { getLogger } from "./logger.js";

const logger = getLogger("networkInfo");

/**
 * Get the primary local IP address (LAN IP)
 * Excludes loopback (127.0.0.1) and virtual adapters
 * Returns the first non-internal IPv4 address found
 */
export function getLocalIPAddress(): string | null {
  try {
    const interfaces = networkInterfaces();

    // Virtual adapter name patterns to exclude
    const virtualPatterns = [
      /^veth/i, // Docker virtual ethernet
      /^docker/i, // Docker
      /^br-/i, // Docker bridge
      /^vmnet/i, // VMware
      /^vbox/i, // VirtualBox
      /^virbr/i, // libvirt
      /^ham/i, // Hamachi
      /^vEthernet/i, // Hyper-V
      /^Bluetooth/i, // Bluetooth adapters
    ];

    for (const [name, addrs] of Object.entries(interfaces)) {
      if (!addrs) continue;

      // Skip virtual adapters
      const isVirtual = virtualPatterns.some((pattern) => pattern.test(name));
      if (isVirtual) continue;

      for (const addr of addrs) {
        // We want IPv4, non-internal addresses
        if (addr.family === "IPv4" && !addr.internal) {
          return addr.address;
        }
      }
    }

    return null;
  } catch (error) {
    logger.warn("Failed to get local IP address:", error);
    return null;
  }
}

/**
 * Get the primary MAC address
 * Returns the MAC address of the interface with the local IP
 */
export function getPrimaryMacAddress(): string | null {
  try {
    const interfaces = networkInterfaces();

    // Virtual adapter name patterns to exclude
    const virtualPatterns = [
      /^veth/i,
      /^docker/i,
      /^br-/i,
      /^vmnet/i,
      /^vbox/i,
      /^virbr/i,
      /^ham/i,
      /^vEthernet/i,
      /^Bluetooth/i,
    ];

    for (const [name, addrs] of Object.entries(interfaces)) {
      if (!addrs) continue;

      // Skip virtual adapters
      const isVirtual = virtualPatterns.some((pattern) => pattern.test(name));
      if (isVirtual) continue;

      // Look for the interface with both IPv4 and MAC
      let hasIPv4 = false;
      let macAddress: string | null = null;

      for (const addr of addrs) {
        if (addr.family === "IPv4" && !addr.internal) {
          hasIPv4 = true;
        }
        if (addr.mac && addr.mac !== "00:00:00:00:00:00") {
          macAddress = addr.mac;
        }
      }

      if (hasIPv4 && macAddress) {
        return macAddress;
      }
    }

    return null;
  } catch (error) {
    logger.warn("Failed to get MAC address:", error);
    return null;
  }
}

/**
 * Get all network interface information
 * Useful for debugging or advanced display
 */
export function getAllNetworkInterfaces() {
  try {
    const interfaces = networkInterfaces();
    const result: Array<{
      name: string;
      ipv4?: string;
      ipv6?: string;
      mac?: string;
      internal: boolean;
    }> = [];

    for (const [name, addrs] of Object.entries(interfaces)) {
      if (!addrs) continue;

      const info: {
        name: string;
        ipv4?: string;
        ipv6?: string;
        mac?: string;
        internal: boolean;
      } = {
        name,
        internal: false,
      };

      for (const addr of addrs) {
        if (addr.family === "IPv4") {
          info.ipv4 = addr.address;
          info.internal = addr.internal;
        } else if (addr.family === "IPv6") {
          info.ipv6 = addr.address;
        }
        if (addr.mac && addr.mac !== "00:00:00:00:00:00") {
          info.mac = addr.mac;
        }
      }

      result.push(info);
    }

    return result;
  } catch (error) {
    logger.warn("Failed to get network interfaces:", error);
    return [];
  }
}
