import { request } from "./request";
import type { Address, AddressInput } from "@/types/api";

export function listAddresses() {
  return request<Address[]>({ url: "/addresses", method: "GET" });
}

export function getAddress(id: number) {
  return request<Address>({ url: `/addresses/${id}`, method: "GET" });
}

export function createAddress(data: AddressInput) {
  return request<Address>({ url: "/addresses", method: "POST", data });
}

export function updateAddress(id: number, data: Partial<AddressInput>) {
  return request<Address>({ url: `/addresses/${id}`, method: "PUT", data });
}

export function deleteAddress(id: number) {
  return request<null>({ url: `/addresses/${id}`, method: "DELETE" });
}
