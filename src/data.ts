export const STATES_AND_DISTRICTS: { [state: string]: string[] } = {
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Trichy", "Salem", "Tirunelveli", "Vellore", "Thanjavur", "Tuticorin"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga", "Purnia", "Arrah", "Begusarai"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Agra", "Prayagraj", "Meerut", "Ghaziabad", "Gorakhpur"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Sambalpur", "Puri", "Balasore", "Bhadrak"],
  "Karnataka": ["Bengaluru", "Mysuru", "Hubballi-Dharwad", "Mangaluru", "Belagavi", "Kalaburagi", "Udupi"],
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Tirupati", "Kakinada"]
};

export const SKILL_CATEGORIES = [
  "Mason",
  "Carpenter",
  "Electrician",
  "Plumber",
  "Welder",
  "Concrete Mixer Operator",
  "Helper / General Labour",
  "Agri-Infrastructure Operator",
  "Excavator Operator"
];

export const ID_PROOF_TYPES = [
  "Aadhaar Card",
  "Voter ID",
  "Ration Card",
  "Driving License",
  "PAN Card"
];

// High-quality mock data for database seed/fallback
export const INITIAL_PROJECTS = [
  {
    id: "proj-1",
    name: "IGO Madurai Agri-Storage Warehouse Phase 2",
    locationState: "Tamil Nadu",
    locationDistrict: "Madurai",
    status: "active",
    requiredSkills: ["Mason", "Welder", "Helper / General Labour"]
  },
  {
    id: "proj-2",
    name: "IGO Trichy Cold Storage Infra Facility",
    locationState: "Tamil Nadu",
    locationDistrict: "Trichy",
    status: "active",
    requiredSkills: ["Agri-Infrastructure Operator", "Electrician", "Helper / General Labour"]
  },
  {
    id: "proj-3",
    name: "IGO Patna Grain Silo Complex",
    locationState: "Bihar",
    locationDistrict: "Patna",
    status: "active",
    requiredSkills: ["Excavator Operator", "Mason", "Concrete Mixer Operator"]
  },
  {
    id: "proj-4",
    name: "IGO Lucknow Mega Fertilizer Depot",
    locationState: "Uttar Pradesh",
    locationDistrict: "Lucknow",
    status: "on-hold",
    requiredSkills: ["Carpenter", "Helper / General Labour"]
  },
  {
    id: "proj-5",
    name: "IGO Bengaluru Rural Micro-Irrigation Canal",
    locationState: "Karnataka",
    locationDistrict: "Bengaluru",
    status: "active",
    requiredSkills: ["Agri-Infrastructure Operator", "Helper / General Labour", "Plumber"]
  }
];

export const INITIAL_SUPERVISORS = [
  {
    id: "super-1",
    name: "Selvam Swamy",
    phone: "9876543210",
    assignedState: "Tamil Nadu",
    assignedDistrict: "Madurai",
    workerCount: 5,
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 15).toISOString() // 15 mins ago
  },
  {
    id: "super-2",
    name: "Ramesh Kumar Singh",
    phone: "8765432109",
    assignedState: "Bihar",
    assignedDistrict: "Patna",
    workerCount: 4,
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString() // 4 hrs ago
  },
  {
    id: "super-3",
    name: "Anand Dwivedi",
    phone: "7654321098",
    assignedState: "Uttar Pradesh",
    assignedDistrict: "Lucknow",
    workerCount: 3,
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString() // 28 hrs ago
  }
];

export const INITIAL_WORKERS = [
  {
    id: "worker-1",
    name: "Muthu Karuppasamy",
    phone: "9123456780",
    age: 32,
    homeState: "Tamil Nadu",
    homeDistrict: "Madurai",
    skill: "Mason",
    idProofType: "Aadhaar Card",
    idProofPhotoUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=400&auto=format&fit=crop",
    profilePhotoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop",
    availability: "available",
    supervisorId: "super-1",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(), // 45 days ago
    lastUpdatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
    status: "active"
  },
  {
    id: "worker-2",
    name: "Kathiresan Pillai",
    phone: "9123456781",
    age: 41,
    homeState: "Tamil Nadu",
    homeDistrict: "Madurai",
    skill: "Agri-Infrastructure Operator",
    idProofType: "Aadhaar Card",
    idProofPhotoUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=400&auto=format&fit=crop",
    profilePhotoUrl: "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?q=80&w=300&auto=format&fit=crop",
    availability: "deployed",
    supervisorId: "super-1",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    lastUpdatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    status: "active"
  },
  {
    id: "worker-3",
    name: "Palani Velu",
    phone: "9123456782",
    age: 28,
    homeState: "Tamil Nadu",
    homeDistrict: "Madurai",
    skill: "Welder",
    idProofType: "Voter ID",
    idProofPhotoUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=400&auto=format&fit=crop",
    profilePhotoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop",
    availability: "available",
    supervisorId: "super-1",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 35).toISOString(), // 35 days ago (flagged if not updated)
    lastUpdatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 35).toISOString(), // 35 days ago (no updates, so flagged!)
    status: "active"
  },
  {
    id: "worker-4",
    name: "Ram Baran Yadav",
    phone: "8123456780",
    age: 35,
    homeState: "Bihar",
    homeDistrict: "Patna",
    skill: "Excavator Operator",
    idProofType: "Aadhaar Card",
    idProofPhotoUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=400&auto=format&fit=crop",
    profilePhotoUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=300&auto=format&fit=crop",
    availability: "available",
    supervisorId: "super-2",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    lastUpdatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    status: "active"
  },
  {
    id: "worker-5",
    name: "Shyam Lal Bind",
    phone: "8123456781",
    age: 48,
    homeState: "Bihar",
    homeDistrict: "Patna",
    skill: "Concrete Mixer Operator",
    idProofType: "Driving License",
    idProofPhotoUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=400&auto=format&fit=crop",
    profilePhotoUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=300&auto=format&fit=crop",
    availability: "deployed",
    supervisorId: "super-2",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 50).toISOString(),
    lastUpdatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40).toISOString(), // 40 days ago (flagged!)
    status: "active"
  }
];

export const INITIAL_DEPLOYMENTS = [
  {
    id: "dep-1",
    workerId: "worker-2",
    projectId: "proj-2",
    requestedBy: "HR-Deepak",
    status: "active",
    startDate: "2026-07-01",
    endDate: "2026-08-15"
  },
  {
    id: "dep-2",
    workerId: "worker-5",
    projectId: "proj-3",
    requestedBy: "HR-Nisha",
    status: "active",
    startDate: "2026-06-15",
    endDate: "2026-08-30"
  },
  {
    id: "dep-3",
    workerId: "worker-1",
    projectId: "proj-1",
    requestedBy: "HR-Deepak",
    status: "requested",
    startDate: "2026-07-15",
    endDate: "2026-09-15"
  }
];
