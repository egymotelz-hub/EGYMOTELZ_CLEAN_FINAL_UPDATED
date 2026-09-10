"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Navbar } from "@/components/Navbar";
import { api } from "@/lib/apiClient";

interface Project {
  id: string;
  currentStage: string;
  progressPct: number;
  property: { address: string; district: { nameAr: string } | null; districtFreeText: string | null; unitCount: number };
}

const STAGE_LABEL: Record<string, string> = {
  DESIGN: "التصميم",
  CONSTRUCTION: "البناء",
  FURNISHING: "التأثيث",
  INSPECTION: "الفحص",
  COMPLETE: "مكتمل",
};
const STAGES = ["DESIGN", "CONSTRUCTION", "FURNISHING", "INSPECTION"];

export default function ContractorPage() {
  const { user, accessToken } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const isContractorOrAdmin = user?.roles.some((r) => ["contractor", "admin", "super_admin"].includes(r));

  async function refresh() {
    if (!accessToken) return;
    const res = await api.get<Project[]>("/contractor/projects", accessToken);
    setProjects(res);
  }

  useEffect(() => {
    if (isContractorOrAdmin) refresh().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isContractorOrAdmin, accessToken]);

  async function advance(id: string) {
    if (!accessToken) return;
    await api.patch(`/contractor/projects/${id}/advance`, {}, accessToken);
    await refresh();
  }

  if (!user || !isContractorOrAdmin) {
    return (
      <div className="screen active" id="sc-contractor">
      <Navbar />
        <div className="int-warn" style={{ margin: 24 }}>
          🔒 هذه البوابة للاستخدام الداخلي فقط — سجّل الدخول بحساب مقاول أو إدارة
        </div>
      </div>
    );
  }

  return (
    <div className="screen active" id="sc-contractor">
      <Navbar />
      <div className="dash-wrap">
        <div className="sidebar">
          <div className="sb-logo">
            <div className="sb-name">
              EGY <span style={{ color: "var(--gold)" }}>MOTELZ</span>
            </div>
            <div className="sb-role">Contractor Portal</div>
          </div>
          <div className="sb-sect">مشاريع — داخلي</div>
          <div className="slink active">المشاريع النشطة</div>
          <div className="slink">المهام</div>
          <div className="slink">التأثيث</div>
        </div>
        <div className="dash-main" dir="rtl">
          <div className="dash-hdr">
            <h2>بوابة المقاولين والتأثيث</h2>
            <span className="int-badge" style={{ fontSize: 10, padding: "4px 10px" }}>
              🔒 داخلي
            </span>
          </div>
          <div className="int-warn">🔒 هذه البوابة للاستخدام الداخلي فقط</div>

          <div className="proj-grid">
            {projects.map((p) => {
              const idx = STAGES.indexOf(p.currentStage);
              return (
                <div className="proj-card pj" key={p.id}>
                  <h4>{p.property.address}</h4>
                  <div className="pj-addr">
                    {p.property.district?.nameAr ?? p.property.districtFreeText ?? ""} — {p.property.unitCount} وحدات
                  </div>
                  <div className="pb-out">
                    <div className="pb-in" style={{ width: `${p.progressPct}%` }} />
                  </div>
                  <div className="pj-meta">
                    <span>{p.progressPct}% مكتمل</span>
                    <span style={{ color: "var(--gold)" }}>{STAGE_LABEL[p.currentStage]}</span>
                  </div>
                  <div className="stages">
                    {STAGES.map((s, i) => (
                      <span key={s} className={`stage ${i < idx ? "s-done" : i === idx ? "s-active" : "s-todo"}`}>
                        {STAGE_LABEL[s]}
                      </span>
                    ))}
                  </div>
                  {p.currentStage !== "COMPLETE" && (
                    <button className="ab-btn g" style={{ marginTop: 8 }} onClick={() => advance(p.id)}>
                      تقدّم للمرحلة التالية
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
