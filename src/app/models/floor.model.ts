export interface Floor {
  id: number;
  name: string;
  floorNumber: number;
  code: string;
  squareMeters: number;
  totalDesks: number;
  totalLockers: number;
  description?: string;
  mapImageUrl?: string;
  departmentName?: string;
  active: boolean;
}

export interface FloorDetail extends Floor {
  desks?: Desk[];
  departments?: Department[];
  statistics?: FloorStatistics;
}

export interface FloorStatistics {
  totalDesks: number;
  availableDesks: number;
  occupiedDesks: number;
  totalLockers: number;
  freeLockers: number;
  assignedLockers: number;
  occupancyRate: number;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  totalDesks: number;
  description?: string;
  floorId: number;
  floorName?: string;
  departmentName?: string;
  active: boolean;
}

export interface Desk {
  id: number;
  deskNumber: string;
  floorId: number;
  floorName?: string;
  departmentId?: number;
  departmentName?: string;
  type: DeskType;
  status: DeskStatus;
  positionX?: number;
  positionY?: number;
  equipment?: string;
  notes?: string;
  nearWindow?: boolean;
  nearElevator?: boolean;
  nearBreakArea?: boolean;
  active: boolean;
  availableForDate?: boolean;
}

export enum DeskType {
  STANDARD = 'STANDARD',
  HOT_DESK = 'HOT_DESK',
  MEETING_ROOM = 'MEETING_ROOM',
  COLLABORATIVE_AREA = 'COLLABORATIVE_AREA'
}

export enum DeskStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  MAINTENANCE = 'MAINTENANCE',
  RESERVED = 'RESERVED'
}
