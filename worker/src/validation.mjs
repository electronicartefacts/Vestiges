export class IntakeError extends Error {
  constructor(code = "INVALID_REQUEST", status = 400) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

const ROOT_KEYS = new Set([
  "schema_version", "form_type", "form_version", "notice_version", "locale",
  "started_at", "website", "data", "notice_acknowledged", "turnstile_token", "request_id"
]);

const COMMON_KEYS = new Set([
  "display_name", "email", "territory", "professional_url", "purpose", "message"
]);

const BRANCHES = {
  PRACTITIONER: {
    fields: new Set(["practice_name", "practice_domain", "career_stage"]),
    required: ["practice_name", "practice_domain"],
    purpose: new Set(["EDITORIAL_EXCHANGE", "FOUNDING_PRACTITIONER", "RESEARCH", "OTHER"]),
    enums: {
      practice_domain: new Set(["MATERIAL_CRAFT", "ART_DESIGN", "TRANSMISSION", "OTHER"]),
      career_stage: new Set(["EMERGING", "ESTABLISHED", "MASTER", "OTHER", "PREFER_NOT_TO_SAY"])
    }
  },
  RESEARCHER: {
    fields: new Set(["field", "affiliation"]),
    required: ["field"],
    purpose: new Set(["RESEARCH_EXCHANGE", "SOURCE_SHARING", "TEACHING", "OTHER"]),
    enums: {}
  },
  INSTITUTION: {
    fields: new Set(["organization_name", "role", "organization_type"]),
    required: ["organization_name", "role", "organization_type"],
    purpose: new Set(["PILOT", "RESEARCH", "TRANSMISSION", "PARTNERSHIP_EXPLORATION", "OTHER"]),
    enums: {
      organization_type: new Set(["MUSEUM", "SCHOOL", "RESEARCH", "TERRITORY", "ASSOCIATION", "OTHER"])
    }
  },
  OTHER: {
    fields: new Set(["role_description"]),
    required: ["role_description"],
    purpose: new Set(["DISCOVER", "CONTRIBUTE", "PROFESSIONAL_EXCHANGE", "OTHER"]),
    enums: {}
  }
};

const LIMITS = {
  display_name: [2, 100], email: [3, 254], territory: [0, 100], professional_url: [0, 500],
  purpose: [1, 64], message: [0, 800], practice_name: [2, 120], practice_domain: [1, 64],
  career_stage: [0, 32], field: [2, 160], affiliation: [0, 160], organization_name: [2, 160],
  role: [2, 120], organization_type: [1, 64], role_description: [2, 160]
};

function assertObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new IntakeError();
}

function assertKnownKeys(object, allowed) {
  if (Object.keys(object).some((key) => !allowed.has(key))) throw new IntakeError();
}

function cleanString(value, key, required = false) {
  if (value === undefined || value === null) {
    if (required) throw new IntakeError();
    return "";
  }
  if (typeof value !== "string") throw new IntakeError();
  const clean = value.trim();
  const [minimum, maximum] = LIMITS[key];
  if ((required && clean.length < minimum) || clean.length > maximum) throw new IntakeError();
  if (!required && clean && clean.length < minimum) throw new IntakeError();
  return clean;
}

function validateEmail(value) {
  const email = cleanString(value, "email", true).toLowerCase();
  if (/[\r\n]/.test(email) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new IntakeError();
  return email;
}

function validateUrl(value) {
  const url = cleanString(value, "professional_url");
  if (!url) return "";
  let parsed;
  try { parsed = new URL(url); } catch { throw new IntakeError(); }
  if (!new Set(["https:", "http:"]).has(parsed.protocol) || parsed.username || parsed.password) throw new IntakeError();
  return parsed.toString();
}

export function validateSubmission(input, now = Date.now()) {
  assertObject(input);
  assertKnownKeys(input, ROOT_KEYS);
  if (input.schema_version !== "vestiges.intake.v1" || input.locale !== "fr-FR") {
    throw new IntakeError("UNSUPPORTED_VERSION", 400);
  }
  if (!BRANCHES[input.form_type]) throw new IntakeError();
  if (typeof input.form_version !== "string" || !/^[a-z0-9._-]{1,32}$/i.test(input.form_version)) throw new IntakeError();
  if (typeof input.notice_version !== "string" || !/^[a-z0-9._-]{1,32}$/i.test(input.notice_version)) throw new IntakeError();
  if (input.notice_acknowledged !== true || input.website !== "") throw new IntakeError();
  if (input.request_id !== undefined && (typeof input.request_id !== "string" || !/^[a-z0-9-]{8,64}$/i.test(input.request_id))) throw new IntakeError();

  const started = Date.parse(input.started_at);
  if (!Number.isFinite(started) || started > now - 3000 || started < now - 86400000) throw new IntakeError();

  assertObject(input.data);
  const branch = BRANCHES[input.form_type];
  const allowedData = new Set([...COMMON_KEYS, ...branch.fields]);
  assertKnownKeys(input.data, allowedData);

  const data = {
    display_name: cleanString(input.data.display_name, "display_name", true),
    email: validateEmail(input.data.email),
    territory: cleanString(input.data.territory, "territory"),
    professional_url: validateUrl(input.data.professional_url),
    purpose: cleanString(input.data.purpose, "purpose", true),
    message: cleanString(input.data.message, "message")
  };
  if (!branch.purpose.has(data.purpose)) throw new IntakeError();

  for (const key of branch.fields) {
    const required = branch.required.includes(key);
    const value = cleanString(input.data[key], key, required);
    if (value || required) data[key] = value;
    if (value && branch.enums[key] && !branch.enums[key].has(value)) throw new IntakeError();
  }

  return {
    schema_version: input.schema_version,
    form_type: input.form_type,
    form_version: input.form_version,
    notice_version: input.notice_version,
    locale: input.locale,
    request_id: input.request_id || "",
    data,
    notice_acknowledged: true
  };
}

