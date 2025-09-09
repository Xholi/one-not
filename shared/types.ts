export type Gender = "male" | "female" | "nonbinary" | "other";
export type Interest = string;

export interface PublicProfile {
  id: string;
  displayName: string;
  age: number;
  bio?: string;
  photos: string[];
  gender?: Gender;
  interests?: Interest[];
  verified: boolean;
  distanceKm?: number;
}
