// User type
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'admin' | 'user';
}

// Region type
export interface Region {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

// Pole type
export interface Pole {
  id: string;
  name: string;
  description: string;
  regionId: string;
  location: {
    latitude: number;
    longitude: number;
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

// Well type
export interface Well {
  id: string;
  name: string;
  poleId: string;
  status: 'active' | 'inactive' | 'maintenance';
  data: {
    lastMeasurement: string;
    waterLevel: number;
    pressure: number;
    flowRate: number;
    observations: string;
    history: any[];
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

// Custom Measurement type
export interface CustomMeasurement {
  name: string;
  value: string | number;
  unit: string;
}

// Measurement type
export interface Measurement {
  id?: string;
  timestamp: string;
  waterLevel: number;
  pressure: number;
  flowRate: number;
  observations: string;
  measuredBy: string;
  customMeasurements?: CustomMeasurement[];
}
