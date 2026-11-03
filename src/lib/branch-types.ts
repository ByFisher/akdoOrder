export interface AdminBranch {
  id: string;
  name: string;
  slug: string;
  city: string;
  district: string;
  address: string;
  isActive: boolean;
  isDefault: boolean;
}

export type PublicBranch = Pick<
  AdminBranch,
  "id" | "name" | "city" | "district" | "address"
>;
