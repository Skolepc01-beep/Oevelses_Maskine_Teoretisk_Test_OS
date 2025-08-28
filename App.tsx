import React, { useMemo, useState, useEffect } from "react";

/* ==========================
   INLINE CSS (no Tailwind)
   ========================== */
const styles = `
:root{
  --bg:#0b0f1a;--bg2:#111624;--panel:#151b2e;--panel2:#0f1423;
  --border:#202842;--text:#e6e9f2;--text-dim:#aab1c6;
  --indigo:#5565ff;--indigo-2:#7181ff;
  --emerald:#2ecc71;--rose:#ff496a;--amber:#ffb020;
}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font-family:Inter,system-ui,Segoe UI,Roboto,Arial,sans-serif}
.app{min-height:100vh;background:linear-gradient(180deg,var(--bg) 0%,var(--bg2) 100%)}
.container{max-width:1100px;margin:0 auto;padding:24px}
.header{position:sticky;top:0;z-index:5;background:rgba(11,15,26,.7);backdrop-filter:saturate(140%) blur(8px);border-bottom:1px solid var(--border)}
.header-inner{max-width:1100px;margin:0 auto;padding:12px 24px;display:flex;justify-content:space-between;align-items:center}
.title{font-weight:800;letter-spacing:.2px}
.badge{display:inline-flex;align-items:center;gap:8px;background:var(--panel);border:1px solid var(--border);padding:8px 12px;border-radius:12px}
.progress{display:flex;align-items:center;gap:12px}
.progressbar{width:160px;height:8px;background:#1b2239;border-radius:999px;overflow:hidden}
.progressbar > div{height:100%;background:var(--indigo)}
.btn{cursor:pointer;border-radius:12px;border:1px solid var(--border);background:var(--panel);color:var(--text);padding:10px 14px}
.btn:hover{filter:brightness(1.1)}
.btn:disabled{opacity:.5;cursor:not-allowed}
.btn-primary{background:var(--indigo);border-color:transparent;color:white}
.btn-primary:hover{background:var(--indigo-2)}
.grid{display:grid;gap:24px}
.layout{display:grid;grid-template-columns:1fr;gap:24px}
@media(min-width:1000px){.layout{grid-template-columns:2fr 1fr}}
.card{background:var(--panel2);border:1px solid var(--border);border-radius:16px;padding:20px;color:var(--text)}
.subtle{color:var(--text-dim);text-transform:uppercase;letter-spacing:.12em;font-size:12px;margin:0 0 8px}
.prompt{font-size:20px;font-weight:700;line-height:1.35;margin:0 0 14px;color:var(--text)}
.opt{width:100%;text-align:left;border-radius:12px;border:1px solid var(--border);background:linear-gradient(180deg,#111729,#0e1527);
      padding:12px 14px;display:flex;gap:10px;align-items:flex-start;color:var(--text)}
.opt:hover{filter:brightness(1.08)}
.opt .radio{margin-top:2px;width:18px;height:18px;border-radius:999px;border:2px solid #3b4466;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.opt .radio .dot{width:10px;height:10px;border-radius:999px;background:var(--indigo)}
.opt.selected{border-color:var(--indigo)}
.opt.correct{background:linear-gradient(180deg,#0e1f16,#0b1812);border-color:#1d9f5a}
.opt.incorrect{background:linear-gradient(180deg,#2a0f19,#1c0a11);border-color:#b93555}
.feedback{margin-top:12px;border:1px solid var(--border);background:linear-gradient(180deg,#111729,#0e1527);
          border-radius:12px;padding:12px;color:var(--text-dim);font-size:14px}
.feedback .ok{color:var(--emerald);font-weight:700}
.feedback .no{color:var(--rose);font-weight:700}
.controls{display:flex;justify-content:space-between;gap:12px;margin-top:16px}
.navigator .chips{display:grid;grid-template-columns:repeat(12,1fr);gap:8px}
.chip{height:34px;border-radius:10px;border:1px solid var(--border);background:#1b2239;color:#dfe4f5;font-size:12px;
      display:flex;align-items:center;justify-content:center}
.chip.answered{background:var(--indigo);color:#fff}
.chip.correct{background:var(--emerald);color:#082312}
.chip.wrong{background:var(--rose);color:#fff}
.result{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
.pill{padding:6px 10px;border-radius:999px;color:white;font-size:12px}
.pill-emerald{background:var(--emerald)} .pill-amber{background:var(--amber)} .pill-rose{background:var(--rose)}
.review-item{border:1px solid var(--border);background:var(--panel2);border-radius:16px;padding:16px;color:var(--text)}
.review-answers{display:grid;gap:8px;margin-top:8px}
.ans{padding:8px 10px;border-radius:10px;border:1px solid var(--border);background:#12192f;color:var(--text)}
.ans.correct{border-color:#1d9f5a;background:#0e1f16}
.ans.yours{border-color:#b93555;background:#2a0f19}
.note{margin-top:8px;color:var(--text-dim);font-size:14px}
`;

/* =============== Helpers =============== */
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function shuffleQuestion(q) {
  const opts = shuffleArray(q.options);
  const correctText = q.options[q.answerIndex];
  const newIdx = opts.findIndex((t) => t === correctText);
  return { ...q, options: opts, answerIndex: newIdx };
}
function sampleQuiz(pool, n) {
  return shuffleArray(pool).slice(0, n).map(shuffleQuestion);
}
function gradeFromPct(p) {
  if (p >= 0.9) return { label: "12-niveau", class: "pill pill-emerald" };
  if (p >= 0.5) return { label: "02-niveau", class: "pill pill-amber" };
  return { label: "Ikke bestået", class: "pill pill-rose" };
}

/* =============== Question Bank (50 fra dig + 10 ekstra) =============== */
const QUESTION_POOL = [
  // ====== DINE 50 ======
  {
    id: 1,
    prompt: "(CMD og batch backup) Hvad er en batch-fil?",
    options: [
      "En .docx-fil",
      "En fil der indeholder kommandoer til automatisering",
      "En database",
      "Et grafikformat",
    ],
    answerIndex: 1,
    explanation: "Batch-filer (.bat/.cmd) kører en sekvens af kommandoer.",
  },
  {
    id: 2,
    prompt:
      "(Basic disk, dynamic disk) Hvordan vises en dynamic disk i Diskhåndtering?",
    options: ["Som RAW", "Som dynamisk", "Som aktiv", "Som optisk drev"],
    answerIndex: 1,
    explanation: "Diskhåndtering (diskmgmt.msc) markerer den som 'Dynamisk'.",
  },
  {
    id: 3,
    prompt:
      "(Shared/NTFS rettigheder) Hvad betyder 'Modify' i NTFS rettigheder?",
    options: [
      "Kun læse",
      "Oprette nye brugere",
      "Læse, skrive og slette filer",
      "Kun omdøbe filer",
    ],
    answerIndex: 2,
    explanation: "Modify = læse/skriv/ændre/slette.",
  },
  {
    id: 4,
    prompt: "(Shared/NTFS rettigheder) Hvordan sættes shared permissions?",
    options: [
      "I BIOS",
      "Via netværksopsætning",
      "Via mapperedigering i Windows",
      "Gennem antivirusprogram",
    ],
    answerIndex: 2,
    explanation: "Mappe → Egenskaber → Deling / Advanced Sharing.",
  },
  {
    id: 5,
    prompt: "(CMD og batch backup) Hvordan kopieres filer i CMD?",
    options: ["sendto", "copy", "cut", "drag"],
    answerIndex: 1,
    explanation: "'copy' (eller xcopy/robocopy) bruges til filkopi.",
  },
  {
    id: 6,
    prompt: "(Virtuelle maskiner) Hvad er en fordel ved virtuelle maskiner?",
    options: [
      "Bruger færre ressourcer end fysisk hardware",
      "Kan ikke deles",
      "Kræver ingen CPU",
      "Ingen konfiguration nødvendig",
    ],
    answerIndex: 0,
    explanation: "Flere VMs kan dele samme fysiske ressourcer.",
  },
  {
    id: 7,
    prompt: "(Komponenter i en PC samt BIOS) Hvad kan ændres i BIOS?",
    options: [
      "Operativsystemets brugerflade",
      "Brugerkontoindstillinger",
      "Hardwarekonfigurationer",
      "Skærmens opløsning",
    ],
    answerIndex: 2,
    explanation: "Fx boot-rækkefølge, SATA/UEFI-indstillinger, XMP.",
  },
  {
    id: 8,
    prompt: "(Shared/NTFS rettigheder) Hvad er en NTFS tilladelse?",
    options: [
      "Et netværkskort",
      "Et adgangsniveau til filer og mapper",
      "En firewall",
      "Et antivirusmodul",
    ],
    answerIndex: 1,
    explanation: "NTFS permissions styrer adgang på filsystemet.",
  },
  {
    id: 9,
    prompt: "(Statisk/dynamisk IP) Hvornår vælger man en statisk IP?",
    options: [
      "Til mobiltelefoner",
      "Til servere og printere",
      "Til tablets",
      "Til DHCP-brugere",
    ],
    answerIndex: 1,
    explanation: "Servere/printere skal være forudsigelige på netværket.",
  },
  {
    id: 10,
    prompt: "(DC, DNS, DHCP, AD) Hvad gør en DNS-server?",
    options: [
      "Oversætter domænenavne til IP-adresser",
      "Skifter adgangskoder",
      "Starter printere",
      "Beskytter mod virus",
    ],
    answerIndex: 0,
    explanation: "DNS resolver navne → IP (A/AAAA-records).",
  },
  {
    id: 11,
    prompt: "(Antivirus og VPN) Hvad står VPN for?",
    options: [
      "Virtual Private Network",
      "Verified PC Network",
      "Virus Protected Network",
      "Virtual Packet Node",
    ],
    answerIndex: 0,
    explanation: "VPN opretter en krypteret tunnel.",
  },
  {
    id: 12,
    prompt: "(DC, DNS, DHCP, AD) Hvad står DC for?",
    options: [
      "Domain Controller",
      "Dynamic Connector",
      "Data Converter",
      "Direct Connection",
    ],
    answerIndex: 0,
    explanation: "DC er AD-serveren der autentificerer brugere/computere.",
  },
  {
    id: 13,
    prompt:
      "(Basic disk, dynamic disk) Hvilken disktype er lettest at konvertere fra?",
    options: [
      "Dynamic til basic",
      "Basic til dynamic",
      "RAID til SSD",
      "NTFS til FAT32",
    ],
    answerIndex: 1,
    explanation:
      "Basic→Dynamic er non-destruktiv; omvendt kræver ofte sletning.",
  },
  {
    id: 14,
    prompt: "(Komponenter i en PC samt BIOS) Hvad bruges CPU'en til?",
    options: [
      "At vise billeder",
      "At bearbejde data og udføre instruktioner",
      "At gemme data permanent",
      "At forbinde til internettet",
    ],
    answerIndex: 1,
    explanation: "CPU udfører instruktioner fra programmer/OS.",
  },
  {
    id: 15,
    prompt: "(DC, DNS, DHCP, AD) Hvad er AD i Windows?",
    options: [
      "Antivirus Database",
      "Access Denied",
      "Active Directory",
      "Application Directory",
    ],
    answerIndex: 2,
    explanation: "AD = katalogtjeneste til identiteter/ressourcer.",
  },
  {
    id: 16,
    prompt: "(CMD og batch backup) Hvordan starter en batchfil typisk?",
    options: ["@echo off", "start /d", "run backup", "backup.exe"],
    answerIndex: 0,
    explanation: "@echo off skjuler kommandogentagelse i output.",
  },
  {
    id: 17,
    prompt: "(Striped, Spanned og Mirror disk) Hvad gør en spanned disk?",
    options: [
      "Spejler data på to diske",
      "Fordeler data med høj sikkerhed",
      "Kombinerer to eller flere diske til én logisk enhed",
      "Øger IOPS",
    ],
    answerIndex: 2,
    explanation: "Spanned = ét volumen over flere diske (ingen redundans).",
  },
  {
    id: 18,
    prompt: "(DC, DNS, DHCP, AD) Hvilken rolle har en domain controller?",
    options: [
      "Kontrollere grafikkort",
      "Administrere netværksbrugere og -politikker",
      "Installere hardware",
      "Opdatere software",
    ],
    answerIndex: 1,
    explanation: "Auth, policies (GPO), katalog, Kerberos.",
  },
  {
    id: 19,
    prompt:
      "(Basic disk, dynamic disk) Hvad kræver konvertering fra basic til dynamic disk?",
    options: [
      "Formatering",
      "BIOS adgang",
      "Ingen data fjernes",
      "Netværksforbindelse",
    ],
    answerIndex: 2,
    explanation: "Konvertering er normalt non-destruktiv (tag backup!).",
  },
  {
    id: 20,
    prompt:
      "(Striped, Spanned og Mirror disk) Hvad bruges mirroring typisk til?",
    options: [
      "Backup og høj tilgængelighed",
      "Øge hastighed",
      "Datafordeling",
      "Spare strøm",
    ],
    answerIndex: 0,
    explanation:
      "Bruges til høj tilgængelighed; husk: spejling er ikke en erstatning for backup.",
  },
  {
    id: 21,
    prompt: "(Microsofts MMC) Hvad står MMC for i Windows?",
    options: [
      "Multiple Media Control",
      "Microsoft Management Console",
      "Memory Management Console",
      "Mainframe Monitoring Control",
    ],
    answerIndex: 1,
    explanation: "MMC hoster administrative snap-ins.",
  },
  {
    id: 22,
    prompt:
      "(Virtuelle maskiner) Hvilket program bruges ofte til at oprette virtuelle maskiner?",
    options: ["Paint", "Oracle VirtualBox", "Notepad", "Google Chrome"],
    answerIndex: 1,
    explanation: "VirtualBox/Hyper-V/VMware er almindelige hypervisors.",
  },
  {
    id: 23,
    prompt: "(Striped, Spanned og Mirror disk) Hvad er en mirror disk?",
    options: [
      "En disk med RAID 5",
      "En disk med høj lagerkapacitet",
      "En disk med installeret antivirus",
      "En disk der kopierer data til en anden for sikkerhed",
    ],
    answerIndex: 3,
    explanation: "RAID 1 = spejling mellem to diske.",
  },
  {
    id: 24,
    prompt: "(CMD og batch backup) Hvad bruges robocopy til?",
    options: [
      "Kopiere og synkronisere filer",
      "Oprette backup af BIOS",
      "Installere programmer",
      "Tjekke harddiskens helbred",
    ],
    answerIndex: 0,
    explanation: "Robust filkopiering/spejling, fx /MIR.",
  },
  {
    id: 25,
    prompt:
      "(Shared/NTFS rettigheder) Hvad er forskellen på shared og NTFS rettigheder?",
    options: [
      "Ingen forskel",
      "NTFS gælder kun for netværk",
      "Shared styrer netværksadgang, NTFS filsystemadgang",
      "Shared er stærkere",
    ],
    answerIndex: 2,
    explanation: "Effektiv adgang = mest restriktive kombination.",
  },
  {
    id: 26,
    prompt: "(Antivirus og VPN) Hvad er formålet med VPN?",
    options: [
      "Skjule data og sikre forbindelse",
      "Hurtigere downloads",
      "Opdatere BIOS",
      "Installere operativsystemer",
    ],
    answerIndex: 0,
    explanation: "Krypterer trafikken over usikre net.",
  },
  {
    id: 27,
    prompt: "(Komponenter i en PC samt BIOS) Hvad står BIOS for?",
    options: [
      "Basic Integrated Operating System",
      "Binary Input Output System",
      "Basic Input Output System",
      "Basic Internal Operating Setup",
    ],
    answerIndex: 2,
    explanation: "Firmware der initialiserer hardware.",
  },
  {
    id: 28,
    prompt: "(Microsofts MMC) Hvad bruges MMC til?",
    options: [
      "Spille spil",
      "Overvåge netværkshastighed",
      "Administrere systemværktøjer og snap-ins",
      "Installere drivere",
    ],
    answerIndex: 2,
    explanation: "Fx Event Viewer, Device Manager som snap-ins.",
  },
  {
    id: 29,
    prompt: "(Microsofts MMC) Hvad er fordelen ved MMC?",
    options: [
      "Forbedrer grafikkortet",
      "Samler administrative værktøjer ét sted",
      "Automatisk backup",
      "Hurtigere CPU-ydeevne",
    ],
    answerIndex: 1,
    explanation: "Central konsol for administration.",
  },
  {
    id: 30,
    prompt:
      "(Statisk/dynamisk IP) Hvor tildeles dynamiske IP-adresser typisk fra?",
    options: ["Gateway", "AD", "DHCP-server", "BIOS"],
    answerIndex: 2,
    explanation: "DHCP udleverer leases og options.",
  },
  {
    id: 31,
    prompt: "(DC, DNS, DHCP, AD) Hvad gør en DHCP-server?",
    options: [
      "Opretter Active Directory",
      "Tildeler IP-adresser automatisk",
      "Sletter brugerkonti",
      "Opdaterer BIOS",
    ],
    answerIndex: 1,
    explanation: "DHCP tildeler IP, netmaske, gateway, DNS m.m.",
  },
  {
    id: 32,
    prompt: "(Antivirus og VPN) Hvad gør et antivirusprogram?",
    options: [
      "Sletter alle filer",
      "Beskytter mod malware og virus",
      "Slukker computeren",
      "Skifter IP-adresse",
    ],
    answerIndex: 1,
    explanation: "Registrerer/blokerer skadelig kode.",
  },
  {
    id: 33,
    prompt:
      "(Statisk/dynamisk IP) Hvilket værktøj viser IP-konfiguration i Windows?",
    options: ["ping", "tracert", "ipconfig", "netstat"],
    answerIndex: 2,
    explanation: "ipconfig /all viser detaljer.",
  },
  {
    id: 34,
    prompt: "(Statisk/dynamisk IP) Hvad er en statisk IP?",
    options: [
      "En IP der skifter automatisk",
      "En IP tildelt manuelt og fast",
      "En IP uden subnet",
      "En IP fra en DNS-server",
    ],
    answerIndex: 1,
    explanation: "Fast sat IP på enheden.",
  },
  {
    id: 35,
    prompt: "(Komponenter i en PC samt BIOS) Hvilken funktion har RAM?",
    options: [
      "Langtidslagring",
      "Grafikbehandling",
      "Midlertidig datalagring",
      "Netværksforbindelse",
    ],
    answerIndex: 2,
    explanation: "Flygtig arbejdshukommelse.",
  },
  {
    id: 36,
    prompt:
      "(Antivirus og VPN) Hvordan vedligeholdes antivirusbeskyttelse bedst?",
    options: [
      "Ignorere advarsler",
      "Deaktivere realtidsbeskyttelse",
      "Regelmæssige opdateringer",
      "Slette antivirus",
    ],
    answerIndex: 2,
    explanation: "Hold motor/signaturer opdateret.",
  },
  {
    id: 37,
    prompt:
      "(Virtuelle maskiner) Hvad kan man typisk ikke gøre med en virtuel maskine?",
    options: [
      "Installere operativsystemer",
      "Køre programmer",
      "Erstatte BIOS",
      "Teste software i isolerede miljøer",
    ],
    answerIndex: 2,
    explanation: "VM har virtualiseret firmware, erstatter ikke hostens BIOS.",
  },
  {
    id: 38,
    prompt:
      "(Basic disk, dynamic disk) Hvad kan en dynamic disk gøre som en basic disk ikke kan?",
    options: [
      "Installere programmer",
      "Understøtte flere operativsystemer",
      "Oprette volumen der spænder over flere diske",
      "Læse BIOS",
    ],
    answerIndex: 2,
    explanation: "Spanned/striped/mirrored (software).",
  },
  {
    id: 39,
    prompt:
      "(Virtuelle maskiner) Hvordan isoleres virtuelle maskiner fra hinanden?",
    options: [
      "Ved brug af kryptering",
      "Ved brug af adgangskoder",
      "Via virtualiseringssoftware",
      "Gennem BIOS-indstillinger",
    ],
    answerIndex: 2,
    explanation: "Hypervisor adskiller gæster (isolation).",
  },
  {
    id: 40,
    prompt: "(Microsofts MMC) Hvordan åbnes MMC?",
    options: ["mmc.exe i Kør", "msinfo32", "dxdiag", "services.msc"],
    answerIndex: 0,
    explanation: "Win+R → mmc.",
  },
  {
    id: 41,
    prompt: "(Microsofts MMC) Hvilket værktøj er et snap-in i MMC?",
    options: [
      "Diskoprydning",
      "Enhedshåndtering",
      "Kommando-prompt",
      "Bluetooth",
    ],
    answerIndex: 1,
    explanation: "Device Manager er et MMC-snap-in.",
  },
  {
    id: 42,
    prompt: "(Basic disk, dynamic disk) Hvad er en basic disk?",
    options: [
      "En disk med RAID-funktioner",
      "En standarddisk med primære og logiske partitioner",
      "En disk der kun understøtter FAT32",
      "En SSD-disk",
    ],
    answerIndex: 1,
    explanation: "MBR/GPT med simple/primære/logiske partitioner.",
  },
  {
    id: 43,
    prompt: "(Komponenter i en PC samt BIOS) Hvad gør en SSD?",
    options: [
      "Producerer strøm",
      "Forbinder netværk",
      "Lagrer data elektronisk",
      "Opdaterer BIOS",
    ],
    answerIndex: 2,
    explanation: "Flash-lagring uden bevægelige dele.",
  },
  {
    id: 44,
    prompt: "(Virtuelle maskiner) Hvad er en virtuel maskine?",
    options: [
      "Et fysisk netværkskort",
      "Et cloud-baseret antivirusprogram",
      "En software-emulering af en fysisk computer",
      "En type BIOS-firmware",
    ],
    answerIndex: 2,
    explanation: "Et gæste-OS kører på virtuelt hardwarelag.",
  },
  {
    id: 45,
    prompt: "(Striped, Spanned og Mirror disk) Hvad er en striped disk?",
    options: [
      "En disk der spejler data",
      "En disk hvor data skrives parallelt over flere diske",
      "En enkeltdisk med partitions",
      "En disk med fejlretning",
    ],
    answerIndex: 1,
    explanation: "Striping = performance, ingen redundans.",
  },
  {
    id: 46,
    prompt:
      "(CMD og batch backup) Hvilket program bruges til at køre batch-filer?",
    options: ["Explorer", "CMD", "Edge", "Services"],
    answerIndex: 1,
    explanation: "cmd.exe (eller PowerShell) kan køre .bat/.cmd.",
  },
  {
    id: 47,
    prompt: "(Antivirus og VPN) Hvad er et tegn på virusinfektion?",
    options: [
      "Langsom opstart",
      "Lydløs CPU",
      "Lav internetforbindelse",
      "Tomme mapper",
    ],
    answerIndex: 0,
    explanation: "Performance issues + uventet adfærd kan indikere malware.",
  },
  {
    id: 48,
    prompt:
      "(Striped, Spanned og Mirror disk) Hvad er ulempen ved en striped disk?",
    options: [
      "Langsom hastighed",
      "Dyrt udstyr",
      "Ingen redundans",
      "Stort strømforbrug",
    ],
    answerIndex: 2,
    explanation: "Fejl i en disk = datatab.",
  },
  {
    id: 49,
    prompt:
      "(Shared/NTFS rettigheder) Hvad sker der hvis NTFS = Læs og Shared = Fuld kontrol?",
    options: [
      "Fuld adgang",
      "Ingen adgang",
      "Kun læseadgang",
      "Sletning muligt",
    ],
    answerIndex: 2,
    explanation: "Mest restriktive vinder → Læs.",
  },
  {
    id: 50,
    prompt: "(Statisk/dynamisk IP) Hvad bruges dynamisk IP typisk til?",
    options: ["Servere", "Printere", "Midlertidige klienter", "NAS-drev"],
    answerIndex: 2,
    explanation: "Klienter der ikke kræver fast adresse.",
  },

  // ====== 10 EKSTRA ======
  {
    id: 51,
    prompt: "(GPO) Hvor linkes Group Policy Objects for at få effekt?",
    options: ["Sites, Domains, OUs i AD", "BIOS", "DHCP-scope", "C:\\ roden"],
    answerIndex: 0,
    explanation: "GPO linkes til AD-objekter: Site/Domain/OU.",
  },
  {
    id: 52,
    prompt: "(DNS) Hvad er en CNAME-record?",
    options: [
      "Alias til andet navn",
      "Alias til IP",
      "Mail exchange",
      "Reverse lookup",
    ],
    answerIndex: 0,
    explanation: "CNAME peger ét navn mod et andet navn.",
  },
  {
    id: 53,
    prompt:
      "(Policies) Hvilken kommando viser effektive policies for bruger/computer?",
    options: ["gpresult /r", "gpupdate /force", "services.msc", "mmc"],
    answerIndex: 0,
    explanation: "gpresult /r opsummerer Resultant Set of Policy.",
  },
  {
    id: 54,
    prompt: "(Robocopy) Hvilken switch spejler en mappe (inkl. sletning)?",
    options: ["/E", "/MIR", "/Z", "/COPY:DAT"],
    answerIndex: 1,
    explanation: "/MIR = /E + spejling (sletter i destination).",
  },
  {
    id: 55,
    prompt: "(RAID 5) Hvad kan RAID 5 typisk tåle?",
    options: ["0 diskfejl", "1 diskfejl", "2 diskfejl", "Kun SSD-fejl"],
    answerIndex: 1,
    explanation: "En disk kan fejle uden datatab (genopbyg kræves).",
  },
  {
    id: 56,
    prompt: "(System Restore) Hvad påvirker et gendannelsespunkt primært?",
    options: [
      "Systemfiler/registreringsdatabase",
      "Brugerens dokumenter",
      "BIOS-firmware",
      "Printerhardware",
    ],
    answerIndex: 0,
    explanation: "Ruller OS-filer/registry tilbage, ikke brugerdata.",
  },
  {
    id: 57,
    prompt: "(DNS) Hvad er en A-record?",
    options: ["Navn → IPv4", "Navn → IPv6", "Alias", "Mail exchange"],
    answerIndex: 0,
    explanation: "A = IPv4; AAAA = IPv6.",
  },
  {
    id: 58,
    prompt: "(CMD) Hvad gør ipconfig /flushdns?",
    options: [
      "Tømmer DNS cache",
      "Skifter IP",
      "Slukker DHCP",
      "Resetter routing",
    ],
    answerIndex: 0,
    explanation: "Rydder klientens resolver cache.",
  },
  {
    id: 59,
    prompt: "(Secure Boot) Formålet med Secure Boot er…",
    options: [
      "Kun at køre betroede bootloaders",
      "At overclocke CPU",
      "At slå BIOS fra",
      "At formatere disken",
    ],
    answerIndex: 0,
    explanation: "Forhindrer usigneret bootkode i at køre.",
  },
  {
    id: 60,
    prompt: "(AD) Hvad er en OU (Organizational Unit)?",
    options: [
      "En container til at organisere objekter",
      "En printerdriver",
      "En DNS-zone",
      "En DHCP-pool",
    ],
    answerIndex: 0,
    explanation: "OUs bruges til at strukturere AD og linke GPO'er.",
  },
];

const QUIZ_SIZE = 24;

/* ==========================
   Component
   ========================== */
export default function App() {
  const [questions, setQuestions] = useState(() =>
    sampleQuiz(QUESTION_POOL, QUIZ_SIZE)
  );
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({}); // i -> optionIndex
  const [submitted, setSubmitted] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);

  const total = questions.length;
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const score = useMemo(
    () =>
      submitted
        ? questions.reduce(
            (acc, q, i) => acc + (answers[i] === q.answerIndex ? 1 : 0),
            0
          )
        : 0,
    [submitted, answers, questions]
  );
  const pct = submitted ? score / total : 0;
  const grade = gradeFromPct(pct);

  useEffect(() => {
    const onKey = (e) => {
      if (reviewMode) return;
      if (e.key === "ArrowRight") setCurrent((c) => Math.min(total - 1, c + 1));
      if (e.key === "ArrowLeft") setCurrent((c) => Math.max(0, c - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [total, reviewMode]);

  function resetExam() {
    setQuestions(sampleQuiz(QUESTION_POOL, QUIZ_SIZE));
    setAnswers({});
    setCurrent(0);
    setSubmitted(false);
    setReviewMode(false);
  }

  const q = questions[current];
  const selected = answers[current];

  const incorrectList = useMemo(() => {
    if (!submitted) return [];
    return questions
      .map((qq, i) => ({
        index: i,
        prompt: qq.prompt,
        options: qq.options,
        chosen: answers[i],
        correct: qq.answerIndex,
        explanation: qq.explanation,
      }))
      .filter((row) => row.chosen !== row.correct);
  }, [submitted, questions, answers]);

  return (
    <div className="app">
      <style>{styles}</style>

      {/* Sticky header */}
      <div className="header">
        <div className="header-inner">
          <div className="title">
            <span style={{ fontSize: 20 }}>OS Eksamens­træner </span>
            <span style={{ color: "var(--indigo)" }}>(GF2)</span>
          </div>
          {!reviewMode ? (
            <div className="progress">
              <div className="progressbar">
                <div style={{ width: `${((current + 1) / total) * 100}%` }} />
              </div>
              <div className="badge">
                {current + 1} / {total}
              </div>
              <button className="btn" onClick={resetExam}>
                Ny prøve
              </button>
            </div>
          ) : (
            <div className="progress">
              <div className={grade.class}>{grade.label}</div>
              <button className="btn" onClick={() => setReviewMode(false)}>
                Tilbage
              </button>
              <button className="btn" onClick={resetExam}>
                Ny prøve
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main */}
      {!reviewMode ? (
        <div className="container layout">
          {/* Left: question card */}
          <section>
            <div className="card">
              <div className="subtle">Multiple Choice</div>
              <div className="prompt">{q.prompt}</div>

              <div className="grid">
                {q.options.map((opt, idx) => {
                  const isSelected = selected === idx;
                  const isCorrect = q.answerIndex === idx;
                  const cls = [
                    "opt",
                    !submitted && isSelected ? "selected" : "",
                    submitted && isCorrect ? "correct" : "",
                    submitted && !isCorrect && isSelected ? "incorrect" : "",
                  ].join(" ");
                  return (
                    <button
                      key={idx}
                      className={cls}
                      onClick={() =>
                        setAnswers((p) => ({ ...p, [current]: idx }))
                      }
                      disabled={submitted}
                    >
                      <div className="radio">
                        {isSelected && !submitted && <div className="dot" />}
                      </div>
                      <div>{opt}</div>
                    </button>
                  );
                })}
              </div>

              {/* Feedback pr. spørgsmål efter aflevering */}
              {submitted && (
                <div className="feedback">
                  {answers[current] === q.answerIndex ? (
                    <div>
                      <span className="ok">✔ Korrekt!</span> {q.explanation}
                    </div>
                  ) : (
                    <div>
                      <span className="no">✘ Forkert.</span> Korrekt svar er{" "}
                      <b>{q.options[q.answerIndex]}</b>.
                      {q.explanation && <span> {q.explanation}</span>}
                    </div>
                  )}
                </div>
              )}

              <div className="controls">
                <button
                  className="btn"
                  disabled={current === 0}
                  onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                >
                  Forrige
                </button>
                {current < total - 1 ? (
                  <button
                    className="btn btn-primary"
                    onClick={() =>
                      setCurrent((c) => Math.min(total - 1, c + 1))
                    }
                  >
                    Næste
                  </button>
                ) : (
                  <button
                    className="btn btn-primary"
                    onClick={() => setSubmitted(true)}
                  >
                    Aflever prøve
                  </button>
                )}
              </div>
            </div>

            {/* Result */}
            {submitted && (
              <div className="card" style={{ marginTop: 16 }}>
                <div className="result">
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 18 }}>
                      Resultat
                    </div>
                    <div style={{ color: "var(--text-dim)", marginTop: 6 }}>
                      Rigtige:{" "}
                      <b style={{ color: "var(--emerald)" }}>{score}</b> /{" "}
                      {total} • Forkerte:{" "}
                      <b style={{ color: "var(--rose)" }}>{total - score}</b>
                    </div>
                  </div>
                  <div className={grade.class}>{grade.label}</div>
                </div>
                <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => setReviewMode(true)}
                  >
                    Se svar
                  </button>
                  <button className="btn" onClick={resetExam}>
                    Ny prøve
                  </button>
                </div>
                <div className="note">
                  Tip: “Se svar” viser kun de spørgsmål du fik forkert – med dit
                  svar, korrekt svar og en kort forklaring. 12-niveau ≥ 90% •
                  02-niveau ≥ 50%.
                </div>
              </div>
            )}
          </section>

          {/* Right: navigator & status */}
          <aside className="grid">
            <div className="card navigator">
              <div className="subtle">Navigér</div>
              <div className="chips">
                {Array.from({ length: total }).map((_, i) => {
                  const hasAns = answers[i] !== undefined;
                  const after =
                    submitted && hasAns
                      ? answers[i] === questions[i].answerIndex
                        ? "correct"
                        : "wrong"
                      : hasAns
                      ? "answered"
                      : "";
                  return (
                    <button
                      key={i}
                      className={`chip ${after}`}
                      onClick={() => setCurrent(i)}
                      title={`Spørgsmål ${i + 1}`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="card">
              <div className="subtle">Status</div>
              <div>
                Besvaret: <b>{answeredCount}</b> / {total}
              </div>
            </div>
          </aside>
        </div>
      ) : (
        // Review mode
        <div className="container grid">
          <div className="card">
            <div className="result">
              <div>
                <div style={{ fontWeight: 800, fontSize: 18 }}>
                  Gennemse svar
                </div>
                <div style={{ color: "var(--text-dim)", marginTop: 6 }}>
                  Rigtige: <b style={{ color: "var(--emerald)" }}>{score}</b> /{" "}
                  {total} • Forkerte:{" "}
                  <b style={{ color: "var(--rose)" }}>{total - score}</b>
                </div>
              </div>
              <div className={grade.class}>{grade.label}</div>
            </div>
            <div className="note">
              Herunder ses KUN dine fejl – med dit svar, korrekt svar og
              forklaring.
            </div>
          </div>

          {incorrectList.length === 0 ? (
            <div className="card" style={{ color: "var(--emerald)" }}>
              Stærkt! Du svarede korrekt på alle spørgsmål.
            </div>
          ) : (
            incorrectList.map((row) => (
              <div key={row.index} className="review-item">
                <div className="subtle">Spørgsmål {row.index + 1}</div>
                <div
                  className="prompt"
                  style={{ fontSize: 18, marginBottom: 10 }}
                >
                  {row.prompt}
                </div>
                <div className="review-answers">
                  {row.options.map((opt, i) => {
                    const cls = [
                      "ans",
                      i === row.correct ? "correct" : "",
                      i === row.chosen && i !== row.correct ? "yours" : "",
                    ].join(" ");
                    return (
                      <div className={cls} key={i}>
                        {opt}
                      </div>
                    );
                  })}
                </div>
                {row.explanation && (
                  <div className="note">
                    <b>Forklaring:</b> {row.explanation}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
