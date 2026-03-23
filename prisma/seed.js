// ─────────────────────────────────────────────────────────────
// Prabisha PM — Database Seed
// Run: node prisma/seed.js
// ─────────────────────────────────────────────────────────────

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Prabisha PM database...\n')

  // ── 1. Team Members ────────────────────────────────────────
  const rawUsers = [
    { name: 'PK (Director)',   email: 'pk@prabisha.com',        role: 'ADMIN',      initials: 'PK',  password: 'Prabisha@2026' },
    { name: 'Dev Team',        email: 'dev@prabisha.com',        role: 'DEVELOPER',  initials: 'DV',  password: 'Prabisha@2026' },
    { name: 'Design Team',     email: 'design@prabisha.com',     role: 'DESIGNER',   initials: 'DS',  password: 'Prabisha@2026' },
    { name: 'Content Team',    email: 'content@prabisha.com',    role: 'CONTENT',    initials: 'CT',  password: 'Prabisha@2026' },
    { name: 'Marketing Team',  email: 'marketing@prabisha.com',  role: 'MARKETING',  initials: 'MK',  password: 'Prabisha@2026' },
  ]

  const users = {}
  for (const u of rawUsers) {
    const hashed = await bcrypt.hash(u.password, 12)
    const user = await prisma.user.upsert({
      where:  { email: u.email },
      update: { name: u.name, role: u.role, initials: u.initials },
      create: { name: u.name, email: u.email, password: hashed, role: u.role, initials: u.initials },
    })
    users[u.name.split(' ')[0]] = user   // key: PK, Dev, Design, Content, Marketing
    console.log(`  ✅ User: ${u.name} (${u.email})`)
  }

  // Helper to resolve owner by display name
  const uid = (name) => {
    if (name === 'PK') return users['PK'].id
    if (name === 'Dev Team') return users['Dev'].id
    if (name === 'Design Team') return users['Design'].id
    if (name === 'Content Team') return users['Content'].id
    if (name === 'Marketing Team') return users['Marketing'].id
    return users['PK'].id
  }

  console.log('\n')

  // ── 2. Projects ────────────────────────────────────────────
  const rawProjects = [
    {
      id: 'P001', name: 'GrowthOS Build', category: 'PRODUCT_DEVELOPMENT',
      status: 'IN_PROGRESS', priority: 'CRITICAL', owner: 'Dev Team',
      startDate: '2026-03-23', dueDate: '2026-04-20', completionPct: 15,
      description: 'Internal SaaS GTM & Sales Intelligence Dashboard — 4-week MVP build per PRD. React + Supabase + Recharts. Modules: Executive Dashboard, Pipeline Management, Sales Performance, Forecasting Engine, CSV Import.',
      riskLevel: 'MEDIUM',
    },
    {
      id: 'P002', name: 'BoilerPlate Product Page & Case Studies', category: 'MARKETING',
      status: 'NOT_STARTED', priority: 'CRITICAL', owner: 'Content Team',
      startDate: '2026-03-24', dueDate: '2026-04-07', completionPct: 0,
      description: 'Dedicated marketing presence with 3+ case studies for BoilerPlate Framework — highest-priority strategic action from consulting review. Must showcase proprietary 100+ module system.',
      riskLevel: 'LOW',
    },
    {
      id: 'P003', name: 'Cyber-Ready MSME — Phase 1', category: 'PRODUCT_DEVELOPMENT',
      status: 'PLANNING', priority: 'HIGH', owner: 'PK',
      startDate: '2026-04-01', dueDate: '2026-06-30', completionPct: 5,
      description: 'Cybersecurity compliance toolkit for Indian MSMEs. 6 modules: AI ThreatGuard, CyberShield Core, AutoResponse Engine, ComplianceOS (DPDPA 2023/CERT-In), CyberAcademy, CyberDash. 3-tier India pricing strategy in place.',
      riskLevel: 'HIGH',
    },
    {
      id: 'P004', name: 'Brand & Website Repositioning', category: 'MARKETING',
      status: 'IN_PROGRESS', priority: 'HIGH', owner: 'Design Team',
      startDate: '2026-03-01', dueDate: '2026-04-15', completionPct: 35,
      description: 'Reposition from broad "digital marketing" to specific "AI-powered business automation". Homepage redesign + new copy aligned to Brand Guidelines v1.0. Grow Faster. Rank Higher. Convert More.',
      riskLevel: 'LOW',
    },
    {
      id: 'P005', name: '0–30 Day Strategic Actions', category: 'OPERATIONS',
      status: 'IN_PROGRESS', priority: 'HIGH', owner: 'PK',
      startDate: '2026-03-01', dueDate: '2026-03-31', completionPct: 55,
      description: 'Execution of immediate-priority items from 18-item strategic review action plan. Covers ISO 27001 gap analysis, automation portfolio documentation, GrowthOS demo, proposal template refresh.',
      riskLevel: 'MEDIUM',
    },
    {
      id: 'P006', name: 'Lead Magnet & Referral Programme', category: 'MARKETING',
      status: 'NOT_STARTED', priority: 'MEDIUM', owner: 'Marketing Team',
      startDate: '2026-04-01', dueDate: '2026-04-30', completionPct: 0,
      description: 'Develop lead magnet asset (AI readiness checklist / MSME cyber guide) and referral programme for client acquisition pipeline. Connect to Mailchimp + n8n automation sequence.',
      riskLevel: 'LOW',
    },
  ]

  for (const p of rawProjects) {
    await prisma.project.upsert({
      where:  { id: p.id },
      update: { name: p.name, status: p.status, priority: p.priority, completionPct: p.completionPct },
      create: {
        id: p.id, name: p.name, category: p.category,
        status: p.status, priority: p.priority,
        ownerId: uid(p.owner),
        startDate: new Date(p.startDate), dueDate: new Date(p.dueDate),
        completionPct: p.completionPct,
        description: p.description,
        riskLevel: p.riskLevel,
      },
    })
    console.log(`  📁 Project: ${p.id} — ${p.name}`)
  }

  console.log('\n')

  // ── 3. Tasks ───────────────────────────────────────────────
  const rawTasks = [
    // GrowthOS (P001)
    { id:'T001', pid:'P001', title:'Architecture setup & database schema design', assignee:'Dev Team', est:16, act:14, status:'COMPLETE',     priority:'CRITICAL', due:'2026-03-28', tags:['backend','architecture'], notes:'Completed ahead of schedule' },
    { id:'T002', pid:'P001', title:'Authentication & RBAC implementation',         assignee:'Dev Team', est:12, act:6,  status:'IN_PROGRESS',  priority:'CRITICAL', due:'2026-03-30', tags:['backend','auth'],         notes:'Using Prabisha SSO + JWT tokens' },
    { id:'T003', pid:'P001', title:'Executive Dashboard UI build',                 assignee:'Dev Team', est:20, act:0,  status:'NOT_STARTED',  priority:'HIGH',     due:'2026-04-04', tags:['frontend'],              notes:'React + Recharts + shadcn/ui' },
    { id:'T004', pid:'P001', title:'Pipeline Management module',                   assignee:'Dev Team', est:24, act:0,  status:'NOT_STARTED',  priority:'HIGH',     due:'2026-04-07', tags:['frontend','backend'],    notes:'Deal stages + funnel visualisation' },
    { id:'T005', pid:'P001', title:'Sales Performance module — leaderboard & rep metrics', assignee:'Dev Team', est:16, act:0, status:'NOT_STARTED', priority:'HIGH', due:'2026-04-11', tags:['frontend'],   notes:'' },
    { id:'T006', pid:'P001', title:'Forecasting engine — weighted probability logic', assignee:'Dev Team', est:20, act:0, status:'NOT_STARTED', priority:'HIGH',  due:'2026-04-14', tags:['backend','logic'],       notes:'Proposal ×30%, Negotiation ×50%, Discovery ×20%' },
    { id:'T007', pid:'P001', title:'CSV import capability',                        assignee:'Dev Team', est:8,  act:0,  status:'NOT_STARTED',  priority:'MEDIUM',   due:'2026-04-15', tags:['backend'],              notes:'Phase 1 data entry method' },
    { id:'T008', pid:'P001', title:'QA testing & bug fixing',                      assignee:'Dev Team', est:16, act:0,  status:'NOT_STARTED',  priority:'HIGH',     due:'2026-04-18', tags:['qa'],                   notes:'' },
    { id:'T009', pid:'P001', title:'UI polish & Vercel deployment',                assignee:'Dev Team', est:8,  act:0,  status:'NOT_STARTED',  priority:'MEDIUM',   due:'2026-04-20', tags:['devops','frontend'],     notes:'Production deployment with docs' },
    // BoilerPlate (P002)
    { id:'T010', pid:'P002', title:'Identify 3 case study clients & gather results data', assignee:'PK', est:4, act:0, status:'NOT_STARTED', priority:'CRITICAL', due:'2026-03-26', tags:['content','strategy'], notes:'Anonymise where needed per AI policy' },
    { id:'T011', pid:'P002', title:'Write 3 full case studies — outcome-led format', assignee:'Content Team', est:12, act:0, status:'NOT_STARTED', priority:'CRITICAL', due:'2026-03-31', tags:['content','copywriting'], notes:'Use Prompt Library A-05 template' },
    { id:'T012', pid:'P002', title:'Design BoilerPlate product page wireframe (Figma)', assignee:'Design Team', est:8, act:0, status:'NOT_STARTED', priority:'HIGH', due:'2026-03-30', tags:['design'], notes:'Brand Guidelines v1.0 — Navy/Orange palette' },
    { id:'T013', pid:'P002', title:'Develop product page (Next.js / BoilerPlate)',  assignee:'Dev Team', est:16, act:0, status:'NOT_STARTED', priority:'HIGH',   due:'2026-04-05', tags:['frontend','dev'],       notes:'' },
    { id:'T014', pid:'P002', title:'SEO optimisation & meta tag setup',             assignee:'Marketing Team', est:4, act:0, status:'NOT_STARTED', priority:'MEDIUM', due:'2026-04-06', tags:['seo'],            notes:'' },
    { id:'T015', pid:'P002', title:'QA review, PK sign-off & go-live',             assignee:'PK', est:3, act:0, status:'NOT_STARTED', priority:'HIGH', due:'2026-04-07', tags:['qa'],                              notes:'' },
    // Cyber-Ready MSME (P003)
    { id:'T016', pid:'P003', title:'Finalise product architecture document — all 6 modules', assignee:'PK', est:8, act:6, status:'IN_PROGRESS', priority:'CRITICAL', due:'2026-03-31', tags:['architecture','strategy'], notes:'Architecture & pricing strategy complete. Module specs need finalising.' },
    { id:'T017', pid:'P003', title:'Tech stack & infra plan (DPDPA/CERT-In compliance)', assignee:'Dev Team', est:12, act:0, status:'NOT_STARTED', priority:'CRITICAL', due:'2026-04-07', tags:['architecture','compliance'], notes:'Must align to DPDPA 2023 + CERT-In mandates' },
    { id:'T018', pid:'P003', title:'AI ThreatGuard module — Phase 1 build',         assignee:'Dev Team', est:80, act:0, status:'NOT_STARTED', priority:'HIGH',   due:'2026-05-15', tags:['dev','ai','security'],  notes:'MITRE ATT&CK framework + CVSS scoring' },
    { id:'T019', pid:'P003', title:'ComplianceOS module — DPDPA 2023 / CERT-In',   assignee:'Dev Team', est:60, act:0, status:'NOT_STARTED', priority:'HIGH',   due:'2026-05-30', tags:['dev','compliance'],     notes:'Core differentiator for Indian market' },
    { id:'T020', pid:'P003', title:'CyberDash executive risk dashboard',            assignee:'Dev Team', est:40, act:0, status:'NOT_STARTED', priority:'MEDIUM', due:'2026-06-15', tags:['frontend','dashboard'], notes:'' },
    { id:'T021', pid:'P003', title:'India channel partner outreach — CAs, associations, IT resellers', assignee:'Marketing Team', est:20, act:0, status:'NOT_STARTED', priority:'HIGH', due:'2026-05-01', tags:['gtm','partnerships'], notes:'CA firms are Tier 1 distribution channel' },
    // Brand (P004)
    { id:'T022', pid:'P004', title:'New homepage copy — AI automation positioning', assignee:'Content Team', est:8,  act:8,  status:'COMPLETE',    priority:'CRITICAL', due:'2026-03-10', tags:['copywriting'],         notes:'Approved by PK. Archived in Google Drive.' },
    { id:'T023', pid:'P004', title:'Homepage redesign v2 (Figma)',                  assignee:'Design Team',  est:16, act:12, status:'IN_PROGRESS', priority:'CRITICAL', due:'2026-03-28', tags:['design','figma'],      notes:'v2 in review — final approval pending' },
    { id:'T024', pid:'P004', title:'Services page rebrand to AI automation focus',  assignee:'Design Team',  est:12, act:0,  status:'NOT_STARTED', priority:'HIGH',     due:'2026-04-05', tags:['design'],              notes:'' },
    { id:'T025', pid:'P004', title:'AI automation dedicated landing page (Next.js)', assignee:'Dev Team',   est:16, act:0,  status:'NOT_STARTED', priority:'HIGH',     due:'2026-04-10', tags:['frontend','dev'],      notes:'' },
    { id:'T026', pid:'P004', title:'LinkedIn banner update & profile repositioning', assignee:'Marketing Team', est:4, act:3, status:'IN_PROGRESS', priority:'MEDIUM', due:'2026-03-28', tags:['social','brand'],     notes:'' },
    // 0-30 Day (P005)
    { id:'T027', pid:'P005', title:'Update LinkedIn positioning statement',         assignee:'PK', est:2, act:2, status:'COMPLETE',    priority:'HIGH',   due:'2026-03-10', tags:['linkedin'],                         notes:'Done' },
    { id:'T028', pid:'P005', title:'ISO 27001 readiness checklist & gap analysis',  assignee:'PK', est:6, act:0, status:'IN_PROGRESS', priority:'HIGH',   due:'2026-03-31', tags:['compliance','enterprise'],         notes:'Key enterprise procurement differentiator' },
    { id:'T029', pid:'P005', title:'Document n8n automation portfolio for client demos', assignee:'Dev Team', est:8, act:4, status:'IN_PROGRESS', priority:'HIGH', due:'2026-03-31', tags:['documentation','automation'], notes:'50% complete. Screenshots + flow diagrams needed.' },
    { id:'T030', pid:'P005', title:'Build GrowthOS demo environment (client-facing)', assignee:'Dev Team', est:12, act:0, status:'NOT_STARTED', priority:'HIGH', due:'2026-03-31', tags:['demo','sales'], notes:'Depends on auth module (T002) completing first' },
    { id:'T031', pid:'P005', title:'Set up Prabisha AI Labs showcase page',          assignee:'Content Team', est:6, act:0, status:'BLOCKED', priority:'MEDIUM', due:'2026-03-31', tags:['content','ai'], notes:'BLOCKED: Waiting for homepage redesign (T023) to be approved' },
    { id:'T032', pid:'P005', title:'Proposal template refresh — new AI positioning', assignee:'Content Team', est:10, act:8, status:'IN_PROGRESS', priority:'HIGH', due:'2026-03-28', tags:['sales','templates'], notes:'80% complete. Two service sections remaining.' },
    // Lead Magnet (P006)
    { id:'T033', pid:'P006', title:'Define lead magnet topic & format',              assignee:'PK', est:3, act:0, status:'NOT_STARTED', priority:'HIGH',   due:'2026-04-05', tags:['strategy'],                         notes:'Decision: AI readiness checklist or MSME cyber guide?' },
    { id:'T034', pid:'P006', title:'Create lead magnet asset — interactive PDF/tool', assignee:'Content Team', est:12, act:0, status:'NOT_STARTED', priority:'HIGH', due:'2026-04-15', tags:['content','design'],   notes:'' },
    { id:'T035', pid:'P006', title:'Build lead capture landing page',                assignee:'Dev Team', est:8, act:0, status:'NOT_STARTED', priority:'MEDIUM', due:'2026-04-20', tags:['frontend','dev'],          notes:'' },
    { id:'T036', pid:'P006', title:'Set up email nurture sequence (Mailchimp + n8n)', assignee:'Marketing Team', est:8, act:0, status:'NOT_STARTED', priority:'MEDIUM', due:'2026-04-25', tags:['automation','email'], notes:'' },
  ]

  for (const t of rawTasks) {
    await prisma.task.upsert({
      where:  { id: t.id },
      update: { status: t.status, actualHrs: t.act },
      create: {
        id: t.id, projectId: t.pid, title: t.title,
        assigneeId: uid(t.assignee),
        estimatedHrs: t.est, actualHrs: t.act,
        status: t.status, priority: t.priority,
        dueDate: new Date(t.due),
        tags: t.tags, notes: t.notes || null,
      },
    })
    console.log(`  📋 Task: ${t.id} — ${t.title.substring(0, 55)}`)
  }

  // ── 4. Task Dependencies ───────────────────────────────────
  console.log('\n  🔗 Seeding task dependencies...')
  const deps = [
    ['T002', 'T001'], ['T003', 'T002'], ['T004', 'T003'],
    ['T005', 'T004'], ['T006', 'T004'], ['T007', 'T002'],
    ['T008', 'T005'], ['T008', 'T006'], ['T009', 'T008'],
    ['T011', 'T010'], ['T012', 'T010'], ['T013', 'T011'],
    ['T013', 'T012'], ['T014', 'T013'], ['T015', 'T014'],
    ['T017', 'T016'], ['T018', 'T017'], ['T019', 'T017'],
    ['T020', 'T018'], ['T020', 'T019'],
    ['T024', 'T023'], ['T025', 'T024'],
    ['T030', 'T002'],
    ['T034', 'T033'], ['T035', 'T034'], ['T036', 'T035'],
  ]

  for (const [dep, on] of deps) {
    await prisma.taskDependency.upsert({
      where:  { dependentTaskId_dependsOnTaskId: { dependentTaskId: dep, dependsOnTaskId: on } },
      update: {},
      create: { dependentTaskId: dep, dependsOnTaskId: on },
    }).catch(() => {}) // skip if tasks don't exist
    process.stdout.write('.')
  }

  console.log('\n\n✅ Seed complete!\n')
  console.log('  Team login credentials (change after first login):')
  console.log('  ──────────────────────────────────────────────────')
  rawUsers.forEach(u => console.log(`  ${u.email.padEnd(30)} password: ${u.password}`))
  console.log('')
}

main()
  .catch((e) => { console.error('❌ Seed error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
