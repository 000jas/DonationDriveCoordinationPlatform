import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Database,
  HandHeart,
  HeartHandshake,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreHorizontal,
  Package,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
  UsersRound,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";

import {
  NEON_CONFIG,
  checkNeonConnection,
  fetchAllFromNeon,
  createDriveInNeon,
  createDonorInNeon,
  createVolunteerInNeon,
  createDonationInNeon,
  assignVolunteerInNeon,
} from "./lib/neon";

type View = "overview" | "drives" | "donors" | "volunteers";
type DriveStatus = "Active" | "Planned" | "Completed";

type Drive = {
  id: string;
  title: string;
  category: string;
  target: number;
  raised: number;
  status: DriveStatus;
  dueDate: string;
  volunteerIds: string[];
  donorCount: number;
  color: string;
};

type Donor = {
  id: string;
  name: string;
  type: "Individual" | "Organization";
  total: number;
  gifts: number;
  lastGift: string;
};

type Volunteer = {
  id: string;
  name: string;
  skill: string;
  hours: number;
  status: "Available" | "Assigned";
  driveId?: string;
};

type Activity = {
  id: string;
  text: string;
  detail: string;
  kind: "donation" | "volunteer" | "drive";
  createdAt: string;
};

type Contribution = {
  id: string;
  driveId: string;
  donorId: string;
  amount: number;
  createdAt: string;
};

type AppData = {
  drives: Drive[];
  donors: Donor[];
  volunteers: Volunteer[];
  activities: Activity[];
  contributions: Contribution[];
};

const emptyData: AppData = { drives: [], donors: [], volunteers: [], activities: [], contributions: [] };
const storageKey = "kindred-workspace";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const shortDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

function loadWorkspace(): AppData {
  try {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return emptyData;
    const parsed = JSON.parse(saved) as Partial<AppData>;
    return {
      drives: parsed.drives ?? [],
      donors: parsed.donors ?? [],
      volunteers: parsed.volunteers ?? [],
      activities: parsed.activities ?? [],
      contributions: parsed.contributions ?? [],
    };
  } catch {
    return emptyData;
  }
}

function formatDateString(val: unknown): string {
  if (!val) return new Date(Date.now() + 86400000 * 20).toISOString().slice(0, 10);
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  if (typeof val === "string") return val.slice(0, 10);
  return String(val).slice(0, 10);
}

function formatIsoString(val: unknown): string {
  if (!val) return new Date().toISOString();
  if (val instanceof Date) return val.toISOString();
  if (typeof val === "string") return val;
  return String(val);
}

function useWorkspaceData() {
  const [data, setData] = useState<AppData>(loadWorkspace);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  const [dbLatency, setDbLatency] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync with live Neon Postgres
  const syncWithNeon = async () => {
    setIsSyncing(true);
    try {
      const conn = await checkNeonConnection();
      setDbConnected(conn.ok);
      setDbLatency(conn.latencyMs);

      if (conn.ok) {
        const neonData = await fetchAllFromNeon();

        // Convert Neon rows to UI format
        const colorPalette = ["orange", "blue", "green", "violet"];
        
        // Map assignments to map volunteer to drive
        const volDriveMap: Record<string, string> = {};
        const driveVolMap: Record<string, string[]> = {};
        (neonData.assignments || []).forEach((a) => {
          volDriveMap[a.volunteer_id] = a.drive_id;
          if (!driveVolMap[a.drive_id]) driveVolMap[a.drive_id] = [];
          driveVolMap[a.drive_id].push(a.volunteer_id);
        });

        // Compute donor counts per drive
        const driveDonorSet: Record<string, Set<string>> = {};
        (neonData.donations || []).forEach((d) => {
          if (!driveDonorSet[d.drive_id]) driveDonorSet[d.drive_id] = new Set();
          if (d.donor_id) driveDonorSet[d.drive_id].add(d.donor_id);
        });

        const drives: Drive[] = (neonData.drives || []).map((d, index) => {
          const rawDate = formatDateString(d.end_date);
          return {
            id: d.id,
            title: d.title,
            category: (d.category || "").replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
            target: Number(d.target_amount) || 0,
            raised: Number(d.raised_amount) || 0,
            status: d.status === "active" ? "Active" : d.status === "completed" ? "Completed" : "Planned",
            dueDate: rawDate,
            volunteerIds: driveVolMap[d.id] || [],
            donorCount: driveDonorSet[d.id]?.size || 0,
            color: colorPalette[index % colorPalette.length],
          };
        });

        const donors: Donor[] = (neonData.donors || []).map((d) => {
          const donorDonations = (neonData.donations || []).filter((don) => don.donor_id === d.id);
          const lastDonation = donorDonations.length > 0 ? formatDateString(donorDonations[0].created_at) : "";
          return {
            id: d.id,
            name: d.full_name,
            type: d.donor_tier === "champion" ? "Organization" : "Individual",
            total: Number(d.total_donated_amount) || 0,
            gifts: d.total_donations_count || donorDonations.length,
            lastGift: lastDonation,
          };
        });

        const volunteers: Volunteer[] = (neonData.volunteers || []).map((v) => ({
          id: v.id,
          name: v.full_name,
          skill: (v.skills && v.skills.length > 0) ? v.skills[0] : "General Support",
          hours: Number(v.total_hours_logged) || 0,
          status: volDriveMap[v.id] ? "Assigned" : "Available",
          driveId: volDriveMap[v.id],
        }));

        const contributions: Contribution[] = (neonData.donations || []).map((don) => ({
          id: don.id,
          driveId: don.drive_id,
          donorId: don.donor_id || "",
          amount: Number(don.amount) || 0,
          createdAt: formatIsoString(don.created_at),
        }));

        const activities: Activity[] = [
          ...(neonData.donations || []).slice(0, 5).map((don) => ({
            id: don.id,
            text: `${don.donor_name} contributed`,
            detail: `${money.format(Number(don.amount))} (${don.donation_type})`,
            kind: "donation" as const,
            createdAt: formatIsoString(don.created_at),
          })),
          ...(neonData.updates || []).slice(0, 3).map((up) => ({
            id: up.id,
            text: up.title,
            detail: (up.content || "").slice(0, 60) + "...",
            kind: "drive" as const,
            createdAt: formatIsoString(up.created_at),
          })),
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        const merged: AppData = { drives, donors, volunteers, contributions, activities };
        setData(merged);
        localStorage.setItem(storageKey, JSON.stringify(merged));
        setError("");
      } else {
        console.warn("Neon connection error:", conn.error);
        setData(loadWorkspace());
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Neon sync error:", msg);
      setDbConnected(false);
      setData(loadWorkspace());
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    syncWithNeon();
  }, []);

  const refresh = async () => {
    setLoading(true);
    await syncWithNeon();
  };

  const mutate = async (resource: "drives" | "donors" | "volunteers" | "contributions", body: unknown) => {
    setError("");
    try {
      const now = new Date().toISOString();
      let next = data;

      if (resource === "drives") {
        const drive = body as Drive;
        next = {
          ...data,
          drives: [drive, ...data.drives],
          activities: [
            { id: crypto.randomUUID(), text: `${drive.title} was created`, detail: `${money.format(drive.target)} target`, kind: "drive", createdAt: now },
            ...data.activities,
          ],
        };

        // Persist to Neon Postgres
        if (dbConnected) {
          createDriveInNeon({
            title: drive.title,
            category: drive.category,
            target_amount: drive.target,
            dueDate: drive.dueDate,
          }).catch((e) => console.error("Neon drive insert error:", e));
        }
      } else if (resource === "donors") {
        const donor = body as Donor;
        next = {
          ...data,
          donors: [donor, ...data.donors],
          activities: [
            { id: crypto.randomUUID(), text: `${donor.name} joined as a donor`, detail: donor.type, kind: "donation", createdAt: now },
            ...data.activities,
          ],
        };

        // Persist to Neon Postgres
        if (dbConnected) {
          createDonorInNeon({
            name: donor.name,
            email: `${donor.name.toLowerCase().replace(/\s+/g, ".")}@example.org`,
            type: donor.type,
          }).catch((e) => console.error("Neon donor insert error:", e));
        }
      } else if (resource === "volunteers") {
        const volunteer = body as Volunteer;
        next = {
          ...data,
          volunteers: [volunteer, ...data.volunteers],
          drives: data.drives.map((drive) =>
            drive.id === volunteer.driveId
              ? { ...drive, volunteerIds: [...drive.volunteerIds, volunteer.id] }
              : drive,
          ),
          activities: [
            { id: crypto.randomUUID(), text: `${volunteer.name} joined the team`, detail: `${volunteer.skill} • ${volunteer.status}`, kind: "volunteer", createdAt: now },
            ...data.activities,
          ],
        };

        // Persist to Neon Postgres
        if (dbConnected) {
          createVolunteerInNeon({
            name: volunteer.name,
            skill: volunteer.skill,
          }).then((volId) => {
            if (volunteer.driveId) {
              assignVolunteerInNeon({
                drive_id: volunteer.driveId,
                volunteer_id: volId,
              });
            }
          }).catch((e) => console.error("Neon volunteer insert error:", e));
        }
      } else {
        const contribution = {
          id: crypto.randomUUID(),
          createdAt: now,
          ...(body as Omit<Contribution, "id" | "createdAt">),
        };
        const drive = data.drives.find((item) => item.id === contribution.driveId);
        const donor = data.donors.find((item) => item.id === contribution.donorId);
        if (!drive || !donor) throw new Error("Choose an existing drive and donor.");
        const firstGiftToDrive = !data.contributions.some(
          (item) => item.driveId === contribution.driveId && item.donorId === contribution.donorId,
        );
        next = {
          ...data,
          contributions: [contribution, ...data.contributions],
          drives: data.drives.map((item) =>
            item.id === contribution.driveId
              ? { ...item, raised: item.raised + contribution.amount, donorCount: item.donorCount + (firstGiftToDrive ? 1 : 0) }
              : item,
          ),
          donors: data.donors.map((item) =>
            item.id === contribution.donorId
              ? { ...item, total: item.total + contribution.amount, gifts: item.gifts + 1, lastGift: now.slice(0, 10) }
              : item,
          ),
          activities: [
            { id: crypto.randomUUID(), text: `${donor.name} contributed`, detail: `${money.format(contribution.amount)} to ${drive.title}`, kind: "donation", createdAt: now },
            ...data.activities,
          ],
        };

        // Persist to Neon Postgres (triggers will fire in DB)
        if (dbConnected) {
          createDonationInNeon({
            drive_id: contribution.driveId,
            donor_id: contribution.donorId,
            donor_name: donor.name,
            donor_email: `${donor.name.toLowerCase().replace(/\s+/g, ".")}@example.org`,
            amount: contribution.amount,
          }).catch((e) => console.error("Neon contribution insert error:", e));
        }
      }

      localStorage.setItem(storageKey, JSON.stringify(next));
      setData(next);
      return true;
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Unable to save this change.";
      setError(message);
      return false;
    }
  };

  return { data, error, loading, mutate, refresh, dbConnected, dbLatency, isSyncing };
}

function Button({
  children,
  className = "",
  variant = "primary",
  type = "button",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "ghost" | "icon";
  type?: "button" | "submit";
  onClick?: () => void;
}) {
  return (
    <button type={type} className={`button button-${variant} ${className}`} onClick={onClick}>
      {children}
    </button>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Modal({
  title,
  subtitle,
  children,
  onClose,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="modal-title">{title}</div>
            <div className="modal-subtitle">{subtitle}</div>
          </div>
          <Button variant="icon" onClick={onClose}><X size={18} /></Button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Login({ onContinue }: { onContinue: (name: string) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  return (
    <div className="login-shell">
      <div className="login-brand">
        <Brand />
        <div className="login-copy">
          <div className="eyebrow"><Sparkles size={14} /> Community impact, organized</div>
          <div className="login-heading">Turn every contribution into meaningful progress.</div>
          <div className="login-description">
            Manage drives, coordinate volunteers, and give your whole team a clear view of the work that matters.
          </div>
        </div>
        <div className="login-proof">
          <div className="proof-icon"><HeartHandshake size={22} /></div>
          <div>
            <strong>One shared workspace</strong>
            <span>For organizers, donors, and volunteer teams.</span>
          </div>
        </div>
      </div>
      <div className="login-panel">
        <div className="login-form">
          <div className="mobile-brand"><Brand /></div>
          <div className="login-title">Welcome to Kindred</div>
          <div className="login-subtitle">Sign in to your organization workspace.</div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              onContinue(name.trim());
            }}
          >
            <Field label="Your name">
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter your name" required />
            </Field>
            <Field label="Work email">
              <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="you@organization.org" required />
            </Field>
            <Button type="submit" className="full-button">Continue to workspace <ArrowRight size={17} /></Button>
          </form>
          <div className="bypass-note"><CheckCircle2 size={16} /> Demo access — powered by Neon Lakebase Postgres</div>
        </div>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div className="brand">
      <div className="brand-mark"><HandHeart size={21} /></div>
      <span>kindred</span>
    </div>
  );
}

function App() {
  const [signedIn, setSignedIn] = useState(() => sessionStorage.getItem("kindred-session") === "active");
  const [userName, setUserName] = useState(() => sessionStorage.getItem("kindred-user") || "Team member");
  const { data, error, loading, mutate, refresh, dbConnected, dbLatency, isSyncing } = useWorkspaceData();
  const [view, setView] = useState<View>("overview");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"drive" | "donor" | "volunteer" | "contribution" | null>(null);
  const [mobileNav, setMobileNav] = useState(false);

  const activeDrives = data.drives.filter((drive) => drive.status === "Active");
  const totalTarget = activeDrives.reduce((sum, drive) => sum + drive.target, 0);
  const totalRaised = activeDrives.reduce((sum, drive) => sum + drive.raised, 0);
  const totalHours = data.volunteers.reduce((sum, volunteer) => sum + volunteer.hours, 0);
  const overallProgress = totalTarget ? Math.round((totalRaised / totalTarget) * 100) : 0;

  const filteredDrives = useMemo(
    () => data.drives.filter((drive) => `${drive.title} ${drive.category} ${drive.status}`.toLowerCase().includes(search.toLowerCase())),
    [data.drives, search],
  );
  const filteredDonors = useMemo(
    () => data.donors.filter((donor) => `${donor.name} ${donor.type}`.toLowerCase().includes(search.toLowerCase())),
    [data.donors, search],
  );
  const filteredVolunteers = useMemo(
    () => data.volunteers.filter((volunteer) => `${volunteer.name} ${volunteer.skill} ${volunteer.status}`.toLowerCase().includes(search.toLowerCase())),
    [data.volunteers, search],
  );

  if (!signedIn) {
    return (
      <Login
        onContinue={(name) => {
          sessionStorage.setItem("kindred-session", "active");
          sessionStorage.setItem("kindred-user", name);
          setUserName(name);
          setSignedIn(true);
        }}
      />
    );
  }

  if (loading && !data.drives.length) {
    return <WorkspaceState title="Connecting to Neon Lakebase Postgres..." copy="Fetching drives, donors, and volunteer coordination data." />;
  }

  const closeModal = () => setModal(null);
  const pageMeta: Record<View, [string, string]> = {
    overview: [`Good morning, ${userName.split(" ")[0]}`, "Here’s how your community is moving forward."],
    drives: ["Donation drives", "Create, monitor, and deliver every campaign."],
    donors: ["Donor community", "Understand and grow the people behind your mission."],
    volunteers: ["Volunteer team", "Keep every helping hand connected and coordinated."],
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="sidebar-top">
          <Brand />
          <Button variant="icon" className="nav-close" onClick={() => setMobileNav(false)}><X size={19} /></Button>
        </div>
        <nav className="nav-list">
          <NavItem active={view === "overview"} icon={<LayoutDashboard size={19} />} label="Overview" onClick={() => { setView("overview"); setMobileNav(false); }} />
          <NavItem active={view === "drives"} icon={<Target size={19} />} label="Donation drives" count={data.drives.filter((drive) => drive.status === "Active").length} onClick={() => { setView("drives"); setMobileNav(false); }} />
          <NavItem active={view === "donors"} icon={<HeartHandshake size={19} />} label="Donors" onClick={() => { setView("donors"); setMobileNav(false); }} />
          <NavItem active={view === "volunteers"} icon={<UsersRound size={19} />} label="Volunteers" onClick={() => { setView("volunteers"); setMobileNav(false); }} />
        </nav>
        <div className="sidebar-impact">
          <div className="impact-icon"><TrendingUp size={18} /></div>
          <div className="impact-label">Overall impact</div>
          <div className="impact-value">{overallProgress}%</div>
          <div className="progress-track small"><div style={{ width: `${Math.min(overallProgress, 100)}%` }} /></div>
          <div className="impact-caption">{money.format(totalRaised)} of {money.format(totalTarget)}</div>
        </div>
        <div className="sidebar-bottom">
          <div className="profile-avatar">{initials(userName)}</div>
          <div className="profile-copy"><strong>{userName}</strong><span>Organization workspace</span></div>
          <Button
            variant="icon"
            onClick={() => {
              sessionStorage.removeItem("kindred-session");
              sessionStorage.removeItem("kindred-user");
              setSignedIn(false);
            }}
          ><LogOut size={17} /></Button>
        </div>
      </aside>

      {mobileNav && <div className="mobile-scrim" onClick={() => setMobileNav(false)} />}

      <main className="main">
        <header className="topbar">
          <Button variant="icon" className="menu-button" onClick={() => setMobileNav(true)}><Menu size={20} /></Button>
          <div className="search-box">
            <Search size={18} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${view === "overview" ? "workspace" : view}...`} />
            <span>⌘ K</span>
          </div>

          {/* Neon Database Status Pill */}
          <div 
            title={`Neon Lakebase Postgres • ${NEON_CONFIG.projectId} • Region: ${NEON_CONFIG.region}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 12px",
              borderRadius: "9999px",
              background: dbConnected ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
              border: `1px solid ${dbConnected ? "rgba(16, 185, 129, 0.25)" : "rgba(239, 68, 68, 0.25)"}`,
              fontSize: "12px",
              fontWeight: 500,
              color: dbConnected ? "#059669" : "#dc2626",
            }}
          >
            <div 
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: dbConnected ? "#10b981" : "#ef4444",
                boxShadow: dbConnected ? "0 0 8px #10b981" : "none"
              }} 
            />
            <span>{dbConnected ? `Neon DB (${dbLatency}ms)` : "Offline DB"}</span>
            <button 
              type="button" 
              onClick={() => void refresh()}
              style={{ 
                background: "none", 
                border: "none", 
                cursor: "pointer", 
                padding: "2px",
                display: "flex",
                color: "inherit"
              }}
              title="Sync data with Neon Postgres"
            >
              <RefreshCw size={13} className={isSyncing ? "animate-spin" : ""} />
            </button>
          </div>

          <Button variant="icon" className="notification"><Bell size={19} /><i /></Button>
          <Button onClick={() => setModal(view === "volunteers" ? "volunteer" : view === "donors" ? "donor" : "drive")}>
            <Plus size={17} /> {view === "volunteers" ? "Add volunteer" : view === "donors" ? "Add donor" : "New drive"}
          </Button>
        </header>

        <div className="content">
          <div className="page-head">
            <div>
              <div className="page-title">{pageMeta[view][0]}</div>
              <div className="page-subtitle">{pageMeta[view][1]}</div>
            </div>
            {view === "overview" && (
              <Button variant="secondary" onClick={() => void refresh()}><Database size={16} /> Sync Neon DB</Button>
            )}
          </div>

          {view === "overview" && (
            <Overview
              data={data}
              activeDrives={activeDrives}
              totalRaised={totalRaised}
              totalHours={totalHours}
              onAllDrives={() => setView("drives")}
              onAddContribution={() => setModal("contribution")}
            />
          )}
          {view === "drives" && <DrivesPage drives={filteredDrives} onAddContribution={() => setModal("contribution")} />}
          {view === "donors" && <DonorsPage donors={filteredDonors} />}
          {view === "volunteers" && <VolunteersPage volunteers={filteredVolunteers} drives={data.drives} />}
        </div>
      </main>

      {error && <div className="save-error">{error}</div>}
      {modal === "drive" && <DriveModal onClose={closeModal} onSave={(drive) => mutate("drives", drive)} />}
      {modal === "donor" && <DonorModal onClose={closeModal} onSave={(donor) => mutate("donors", donor)} />}
      {modal === "volunteer" && <VolunteerModal drives={data.drives} onClose={closeModal} onSave={(volunteer) => mutate("volunteers", volunteer)} />}
      {modal === "contribution" && <ContributionModal drives={activeDrives} donors={data.donors} onClose={closeModal} onSave={(driveId, donorId, amount) => mutate("contributions", { driveId, donorId, amount })} />}
    </div>
  );
}

function WorkspaceState({ title, copy, action }: { title: string; copy: string; action?: ReactNode }) {
  return (
    <div className="workspace-state">
      <Brand />
      <div className="workspace-state-card">
        <div className="impact-icon"><HeartHandshake size={19} /></div>
        <strong>{title}</strong>
        <span>{copy}</span>
        {action}
      </div>
    </div>
  );
}

function NavItem({ active, icon, label, count, onClick }: { active: boolean; icon: ReactNode; label: string; count?: number; onClick: () => void }) {
  return (
    <button className={`nav-item ${active ? "active" : ""}`} onClick={onClick}>
      {icon}<span>{label}</span>{count !== undefined && <b>{count}</b>}
    </button>
  );
}

function Overview({ data, activeDrives, totalRaised, totalHours, onAllDrives, onAddContribution }: {
  data: AppData;
  activeDrives: Drive[];
  totalRaised: number;
  totalHours: number;
  onAllDrives: () => void;
  onAddContribution: () => void;
}) {
  const avg = activeDrives.length ? Math.round(activeDrives.reduce((sum, drive) => sum + (drive.raised / drive.target) * 100, 0) / activeDrives.length) : 0;
  const metrics = [
    { label: "Funds raised", value: money.format(totalRaised), note: "Across active drives", icon: <CircleDollarSign size={20} />, tone: "mint" },
    { label: "Active drives", value: activeDrives.length.toString(), note: `${avg}% average progress`, icon: <Target size={20} />, tone: "orange" },
    { label: "Active volunteers", value: data.volunteers.filter((volunteer) => volunteer.status === "Assigned").length.toString(), note: `${totalHours} hours contributed`, icon: <UsersRound size={20} />, tone: "blue" },
    { label: "Donor community", value: data.donors.length.toString(), note: `${data.donors.reduce((sum, donor) => sum + donor.gifts, 0)} total gifts`, icon: <HeartHandshake size={20} />, tone: "violet" },
  ];
  return (
    <>
      <div className="metric-grid">
        {metrics.map((metric) => (
          <div className="metric-card" key={metric.label}>
            <div className={`metric-icon ${metric.tone}`}>{metric.icon}</div>
            <div className="metric-label">{metric.label}</div>
            <div className="metric-value">{metric.value}</div>
            <div className="metric-note">{metric.note}</div>
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <section className="panel drives-panel">
          <PanelHead title="Active drives" subtitle="Progress across your current campaigns" action={<Button variant="ghost" onClick={onAllDrives}>View all <ArrowRight size={15} /></Button>} />
          <div className="drive-list">
            {activeDrives.slice(0, 3).map((drive) => <DriveRow key={drive.id} drive={drive} />)}
          </div>
        </section>
        <section className="panel activity-panel">
          <PanelHead title="Recent activity" subtitle="The latest from your community" />
          <div className="activity-list">
            {data.activities.slice(0, 4).map((item) => (
              <div className="activity-item" key={item.id}>
                <div className={`activity-icon ${item.kind}`}>
                  {item.kind === "donation" ? <CircleDollarSign size={17} /> : item.kind === "volunteer" ? <UserRound size={17} /> : <Target size={17} />}
                </div>
                <div><strong>{item.text}</strong><span>{item.detail}</span><small>{relativeTime(item.createdAt)}</small></div>
              </div>
            ))}
          </div>
          <Button className="full-button" onClick={onAddContribution}><Plus size={17} /> Record a contribution</Button>
        </section>
      </div>
      <div className="lower-grid">
        <section className="panel volunteer-panel">
          <PanelHead title="Volunteer pulse" subtitle="Current team availability" />
          <div className="volunteer-visual">
            <div className="ring" style={{ "--progress": `${Math.round((data.volunteers.filter((v) => v.status === "Assigned").length / Math.max(data.volunteers.length, 1)) * 100)}%` } as React.CSSProperties}>
              <div><strong>{data.volunteers.filter((v) => v.status === "Assigned").length}</strong><span>assigned</span></div>
            </div>
            <div className="pulse-stats">
              <div><i className="dot assigned" /><span>Assigned</span><strong>{data.volunteers.filter((v) => v.status === "Assigned").length}</strong></div>
              <div><i className="dot available" /><span>Available</span><strong>{data.volunteers.filter((v) => v.status === "Available").length}</strong></div>
              <div><Clock3 size={15} /><span>Total hours</span><strong>{totalHours}</strong></div>
            </div>
          </div>
        </section>
        <section className="panel deadline-panel">
          <PanelHead title="Upcoming deadlines" subtitle="Keep your team one step ahead" />
          {activeDrives
            .slice()
            .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
            .slice(0, 3)
            .map((drive) => (
              <div className="deadline-item" key={drive.id}>
                <div className="date-tile"><strong>{new Date(`${drive.dueDate}T12:00:00`).getDate()}</strong><span>{new Date(`${drive.dueDate}T12:00:00`).toLocaleDateString("en-US", { month: "short" })}</span></div>
                <div><strong>{drive.title}</strong><span>{Math.max(Math.ceil((new Date(drive.dueDate).getTime() - Date.now()) / 86400000), 0)} days remaining</span></div>
                <div className="mini-progress"><div style={{ width: `${Math.min(Math.round((drive.raised / drive.target) * 100), 100)}%` }} /></div>
              </div>
            ))}
        </section>
      </div>
    </>
  );
}

function PanelHead({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return <div className="panel-head"><div><div className="panel-title">{title}</div><div className="panel-subtitle">{subtitle}</div></div>{action}</div>;
}

function DriveRow({ drive }: { drive: Drive }) {
  const percentage = Math.min(Math.round((drive.raised / drive.target) * 100), 100);
  return (
    <div className="drive-row">
      <div className={`drive-symbol ${drive.color}`}><Package size={19} /></div>
      <div className="drive-main">
        <div className="drive-title-line"><strong>{drive.title}</strong><span>{percentage}%</span></div>
        <div className="drive-category">{drive.category} • Due {shortDate.format(new Date(`${drive.dueDate}T12:00:00`))}</div>
        <div className="progress-track"><div className={drive.color} style={{ width: `${percentage}%` }} /></div>
        <div className="drive-meta"><span><strong>{money.format(drive.raised)}</strong> raised of {money.format(drive.target)}</span><span><UsersRound size={14} /> {drive.volunteerIds.length} volunteers</span></div>
      </div>
      <Button variant="icon"><MoreHorizontal size={18} /></Button>
    </div>
  );
}

function DrivesPage({ drives, onAddContribution }: { drives: Drive[]; onAddContribution: () => void }) {
  const [filter, setFilter] = useState<"All" | DriveStatus>("All");
  const visibleDrives = filter === "All" ? drives : drives.filter((drive) => drive.status === filter);
  return (
    <div className="page-stack">
      <div className="list-toolbar">
        {(["All", "Active", "Completed"] as const).map((option) => (
          <button className={`filter-chip ${filter === option ? "active" : ""}`} onClick={() => setFilter(option)} key={option}>
            {option === "All" ? "All drives" : option}
            {option === "All" && <span>{drives.length}</span>}
          </button>
        ))}
        <Button variant="secondary" onClick={onAddContribution}><CircleDollarSign size={17} /> Record contribution</Button>
      </div>
      <div className="drive-card-grid">
        {visibleDrives.map((drive) => {
          const percent = Math.min(Math.round((drive.raised / drive.target) * 100), 100);
          return (
            <div className="drive-card" key={drive.id}>
              <div className="drive-card-top"><div className={`drive-symbol large ${drive.color}`}><Package size={22} /></div><span className={`status ${drive.status.toLowerCase()}`}>{drive.status}</span></div>
              <div className="drive-card-title">{drive.title}</div>
              <div className="drive-card-category">{drive.category}</div>
              <div className="drive-amount"><strong>{money.format(drive.raised)}</strong><span> of {money.format(drive.target)}</span></div>
              <div className="progress-track"><div className={drive.color} style={{ width: `${percent}%` }} /></div>
              <div className="drive-card-footer"><span>{percent}% funded</span><span><UsersRound size={14} /> {drive.volunteerIds.length} volunteers</span></div>
              <div className="drive-card-date"><CalendarDays size={15} /> Due {shortDate.format(new Date(`${drive.dueDate}T12:00:00`))}<span>{drive.donorCount} donors</span></div>
            </div>
          );
        })}
      </div>
      {!visibleDrives.length && <EmptyState title="No drives found" copy="Try a different search or choose another status." />}
    </div>
  );
}

function DonorsPage({ donors }: { donors: Donor[] }) {
  return (
    <div className="panel table-panel">
      <PanelHead title={`${donors.length} donors`} subtitle="Contribution history and community relationships" />
      <div className="data-table">
        <div className="table-row table-header"><span>Donor</span><span>Type</span><span>Total given</span><span>Gifts</span><span>Last gift</span></div>
        {donors.map((donor) => (
          <div className="table-row" key={donor.id}>
            <span className="person-cell"><i>{initials(donor.name)}</i><strong>{donor.name}</strong></span>
            <span><b className="type-chip">{donor.type}</b></span>
            <span className="amount-cell">{money.format(donor.total)}</span>
            <span>{donor.gifts}</span>
            <span>{donor.lastGift ? shortDate.format(new Date(`${donor.lastGift}T12:00:00`)) : "No gifts yet"}</span>
          </div>
        ))}
      </div>
      {!donors.length && <EmptyState title="No donors found" copy="Try a different search or add a new donor." />}
    </div>
  );
}

function VolunteersPage({ volunteers, drives }: { volunteers: Volunteer[]; drives: Drive[] }) {
  return (
    <div className="people-grid">
      {volunteers.map((volunteer) => {
        const assignedDrive = drives.find((drive) => drive.id === volunteer.driveId);
        return (
          <div className="person-card" key={volunteer.id}>
            <div className="person-card-top"><div className="large-avatar">{initials(volunteer.name)}</div><span className={`availability ${volunteer.status.toLowerCase()}`}><i />{volunteer.status}</span></div>
            <div className="person-name">{volunteer.name}</div>
            <div className="person-skill">{volunteer.skill}</div>
            <div className="person-divider" />
            <div className="person-detail"><Clock3 size={16} /><span>Hours contributed</span><strong>{volunteer.hours}</strong></div>
            <div className="person-detail"><Target size={16} /><span>{assignedDrive?.title ?? "Ready for assignment"}</span></div>
          </div>
        );
      })}
      {!volunteers.length && <EmptyState title="No volunteers found" copy="Try a different search or invite a new volunteer." />}
    </div>
  );
}

function EmptyState({ title, copy }: { title: string; copy: string }) {
  return <div className="empty"><Search size={22} /><strong>{title}</strong><span>{copy}</span></div>;
}

function DriveModal({ onClose, onSave }: { onClose: () => void; onSave: (drive: Drive) => Promise<boolean> }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [target, setTarget] = useState("");
  const [dueDate, setDueDate] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (await onSave({ id: crypto.randomUUID(), title, category, target: Number(target), raised: 0, status: "Active", dueDate, volunteerIds: [], donorCount: 0, color: ["orange", "blue", "green", "violet"][Math.floor(Math.random() * 4)] })) onClose();
  };
  return <Modal title="Create a donation drive" subtitle="Set a target and start rallying your community." onClose={onClose}><form onSubmit={submit} className="modal-form"><Field label="Drive name"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. School Supply Sprint" required /></Field><Field label="Category"><input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Education" required /></Field><div className="form-grid"><Field label="Fundraising target"><input value={target} onChange={(e) => setTarget(e.target.value)} type="number" min="1" placeholder="0" required /></Field><Field label="Due date"><input value={dueDate} onChange={(e) => setDueDate(e.target.value)} type="date" required /></Field></div><div className="modal-actions"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit">Create drive <ArrowRight size={16} /></Button></div></form></Modal>;
}

function DonorModal({ onClose, onSave }: { onClose: () => void; onSave: (donor: Donor) => Promise<boolean> }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<Donor["type"]>("Individual");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (await onSave({ id: crypto.randomUUID(), name, type, total: 0, gifts: 0, lastGift: "" })) onClose();
  };
  return <Modal title="Add a donor" subtitle="Grow your community of supporters." onClose={onClose}><form onSubmit={submit} className="modal-form"><Field label="Donor name"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Person or organization name" required /></Field><Field label="Donor type"><select value={type} onChange={(e) => setType(e.target.value as Donor["type"])}><option>Individual</option><option>Organization</option></select></Field><div className="modal-actions"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit">Add donor <ArrowRight size={16} /></Button></div></form></Modal>;
}

function VolunteerModal({ drives, onClose, onSave }: { drives: Drive[]; onClose: () => void; onSave: (volunteer: Volunteer) => Promise<boolean> }) {
  const [name, setName] = useState("");
  const [skill, setSkill] = useState("");
  const [driveId, setDriveId] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (await onSave({ id: crypto.randomUUID(), name, skill, hours: 0, status: driveId ? "Assigned" : "Available", driveId: driveId || undefined })) onClose();
  };
  return <Modal title="Add a volunteer" subtitle="Bring a new helping hand into your team." onClose={onClose}><form onSubmit={submit} className="modal-form"><Field label="Volunteer name"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" required /></Field><Field label="Primary skill"><input value={skill} onChange={(e) => setSkill(e.target.value)} placeholder="e.g. Logistics" required /></Field><Field label="Assign to a drive (optional)"><select value={driveId} onChange={(e) => setDriveId(e.target.value)}><option value="">Available for assignment</option>{drives.filter((drive) => drive.status === "Active").map((drive) => <option value={drive.id} key={drive.id}>{drive.title}</option>)}</select></Field><div className="modal-actions"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit">Add volunteer <ArrowRight size={16} /></Button></div></form></Modal>;
}

function ContributionModal({ drives, donors, onClose, onSave }: { drives: Drive[]; donors: Donor[]; onClose: () => void; onSave: (driveId: string, donorId: string, amount: number) => Promise<boolean> }) {
  const [driveId, setDriveId] = useState(drives[0]?.id ?? "");
  const [donorId, setDonorId] = useState(donors[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (await onSave(driveId, donorId, Number(amount))) onClose();
  };
  return <Modal title="Record a contribution" subtitle="Add a gift and update campaign progress instantly." onClose={onClose}><form onSubmit={submit} className="modal-form"><Field label="Donation drive"><select value={driveId} onChange={(e) => setDriveId(e.target.value)} required>{drives.map((drive) => <option value={drive.id} key={drive.id}>{drive.title}</option>)}</select></Field><Field label="Donor"><select value={donorId} onChange={(e) => setDonorId(e.target.value)} required>{donors.map((donor) => <option value={donor.id} key={donor.id}>{donor.name}</option>)}</select></Field><Field label="Contribution amount"><input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min="1" placeholder="0" required /></Field><div className="modal-actions"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit"><Check size={16} /> Save contribution</Button></div></form></Modal>;
}

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
}

function relativeTime(value: string) {
  const hours = Math.max(Math.floor((Date.now() - new Date(value).getTime()) / 3600000), 0);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default App;
