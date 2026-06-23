import { describe, expect, it } from "vitest";
import { answerPortfolioQuestion } from "@/lib/assistant/portfolio-assistant";

const fixture = {
  today: new Date("2026-06-17T12:00:00.000Z"),
  properties: [
    {
      id: "property_loch",
      address: "Loch Lomand",
      currentTenants: "Avery Johnson",
      rentAmount: "$2,450",
      leaseStart: "2026-01-01",
      leaseEnd: "2026-12-31",
      tenantPhone: "555-0144",
      tenantEmail: "avery@example.com",
      tenantBirthdays: "Avery Johnson: June 20",
      tenantNotes: "Prefers text messages after 5 PM",
      pets: "1 dog",
      owner: "Example Property Group",
      brokerSplit: "70 / 30",
      status: "Active",
      driveFolderUrl: "https://drive.google.com/drive/folders/loch",
      profile: {
        applianceInfo: "Fridge LG LFXS26973. Dishwasher Bosch 300.",
        filterSize: "16x20x1",
        homeWarranty: "Choice Home Warranty through 2027-01-15.",
        hoaInfo: "No HOA on file.",
        utilityProviders: "Electric: City Power. Water: City Water.",
        accessCodes: "Gate: 2468. Garage: 1357.",
      },
    },
    {
      id: "property_verona",
      address: "Verona",
      currentTenants: "Mia Chen",
      rentAmount: "$2,850",
      leaseStart: "2025-08-01",
      leaseEnd: "2026-08-01",
      tenantPhone: "555-0199",
      tenantEmail: "mia@example.com",
      tenantBirthdays: "Mia Chen: February 12",
      pets: "No pets",
      owner: "Example Property Group",
      brokerSplit: "70 / 30",
      status: "Active",
      driveFolderUrl: "https://drive.google.com/drive/folders/verona",
      profile: null,
    },
    {
      id: "property_vacant",
      address: "Wood Court",
      currentTenants: "",
      rentAmount: "$0",
      leaseStart: "",
      leaseEnd: "",
      tenantPhone: "",
      tenantEmail: "",
      tenantBirthdays: "",
      pets: "",
      owner: "Example Property Group",
      brokerSplit: "70 / 30",
      status: "Vacant",
      driveFolderUrl: "",
      profile: null,
    },
    {
      id: "property_st_paul",
      address: "St. Paul",
      currentTenants: "Noah Patel",
      rentAmount: "$2,200",
      leaseStart: "2025-09-15",
      leaseEnd: "2026-09-15",
      tenantPhone: "555-0112",
      tenantEmail: "noah@example.com",
      tenantBirthdays: "Noah Patel: September 4",
      pets: "Cat",
      owner: "Example Property Group",
      brokerSplit: "65 / 35",
      status: "Active",
      driveFolderUrl: "https://drive.google.com/drive/folders/st-paul",
      profile: null,
    },
  ],
  driveFiles: [
    {
      id: "drive_lease",
      name: "Loch Lomand Lease",
      category: "lease",
      webViewLink: "https://drive.google.com/loch-lease",
      propertyIndexId: "property_loch",
    },
    {
      id: "drive_maintenance",
      name: "Loch Lomand Dishwasher Repair",
      category: "maintenance",
      webViewLink: "https://drive.google.com/loch-maintenance",
      propertyIndexId: "property_loch",
      textExtract:
        "Dishwasher replaced by Jim's HVAC on 2026-05-10. Warranty expires on 2027-05-10.",
    },
    {
      id: "drive_application",
      name: "Loch Lomand Rental Application",
      category: "application",
      webViewLink: "https://drive.google.com/loch-application",
      propertyIndexId: "property_loch",
      textExtract:
        "Applicant Avery Johnson reported monthly income of $7,800, one dog, and a requested move-in date of 2026-01-01.",
    },
    {
      id: "drive_project",
      name: "Wood Court Remodel Scope",
      category: "project",
      webViewLink: "https://drive.google.com/wood-project",
      propertyIndexId: "property_vacant",
    },
    {
      id: "drive_financial",
      name: "St. Paul Owner Statement",
      category: "financial",
      webViewLink: "https://drive.google.com/st-paul-financial",
      propertyIndexId: "property_st_paul",
      textExtract: "Owner statement and deposited check for St. Paul.",
    },
    {
      id: "drive_template",
      name: "Move-In Checklist",
      category: "template",
      webViewLink: "https://docs.google.com/document/d/template",
      propertyIndexId: null,
    },
  ],
  templates: [
    {
      id: "template_move_in",
      name: "Move-In Checklist",
      description: "Reusable move-in checklist template.",
    },
    {
      id: "template_welcome",
      name: "Welcome Letter",
      description: "Reusable welcome letter template.",
    },
  ],
  vendors: [
    {
      id: "vendor_jim",
      name: "Jim's HVAC",
      trade: "HVAC",
      phone: "555-0188",
      email: "service@jim.example",
      notes: "Completed the Loch Lomand dishwasher replacement.",
      licenseStatus: "License on file",
      insuranceStatus: "Insurance on file",
      propertyLinks: [
        {
          id: "property_loch",
          address: "Loch Lomand",
        },
      ],
    },
  ],
  generatedDocuments: [
    {
      id: "generated_move_in",
      title: "Move-In Checklist - Loch Lomand",
      status: "generated",
      renderedBody:
        "Move-In Checklist for Avery Johnson at Loch Lomand. Confirm keys are delivered.",
      pdfUrl: "/api/documents/pdf/generated_move_in",
      googleDocUrl: "https://docs.google.com/document/d/generated-move-in",
      errorMessage: null,
      propertyIndexId: "property_loch",
      propertyAddress: "Loch Lomand",
      createdAt: new Date("2026-06-17T15:00:00.000Z"),
    },
  ],
};

describe("answerPortfolioQuestion", () => {
  it("answers who lives at a property with a citation", () => {
    const answer = answerPortfolioQuestion("Who lives at Loch Lomand?", fixture);

    expect(answer.answer).toBe("Avery Johnson lives at Loch Lomand.");
    expect(answer.citations).toEqual([
      {
        label: "Master spreadsheet row for Loch Lomand",
        href: "/houses/property_loch",
      },
    ]);
  });

  it("matches a natural property nickname against a full street address", () => {
    const answer = answerPortfolioQuestion("Who lives at Loch Lomand?", {
      ...fixture,
      properties: [
        {
          ...fixture.properties[0],
          address: "161 Loch Lomand Drive",
        },
      ],
    });

    expect(answer.answer).toBe("Avery Johnson lives at 161 Loch Lomand Drive.");
    expect(answer.citations).toEqual([
      {
        label: "Master spreadsheet row for 161 Loch Lomand Drive",
        href: "/houses/property_loch",
      },
    ]);
  });

  it("answers rent questions from the property index", () => {
    const answer = answerPortfolioQuestion("What is the rent at Verona?", fixture);

    expect(answer.answer).toBe("The rent at Verona is $2,850.");
  });

  it("answers tenant email, pets, owner, and broker split from the property index", () => {
    const email = answerPortfolioQuestion(
      "What is the tenant email for Loch Lomand?",
      fixture,
    );
    const pets = answerPortfolioQuestion("Does Loch Lomand have pets?", fixture);
    const owner = answerPortfolioQuestion("Who owns Loch Lomand?", fixture);
    const brokerSplit = answerPortfolioQuestion(
      "What is the broker split at Loch Lomand?",
      fixture,
    );

    expect(email.answer).toBe(
      "The tenant email for Loch Lomand is avery@example.com.",
    );
    expect(pets.answer).toBe("Pets for Loch Lomand: 1 dog.");
    expect(owner.answer).toBe("The owner for Loch Lomand is Example Property Group.");
    expect(brokerSplit.answer).toBe(
      "The broker split for Loch Lomand is 70 / 30.",
    );
    expect(email.citations).toEqual([
      {
        label: "Master spreadsheet row for Loch Lomand",
        href: "/houses/property_loch",
      },
    ]);
  });

  it("answers tenant note questions from the property index", () => {
    const answer = answerPortfolioQuestion(
      "What are the tenant notes for Loch Lomand?",
      fixture,
    );

    expect(answer.answer).toBe(
      "Tenant notes for Loch Lomand: Prefers text messages after 5 PM.",
    );
    expect(answer.citations).toEqual([
      {
        label: "Master spreadsheet row for Loch Lomand",
        href: "/houses/property_loch",
      },
    ]);
  });

  it("answers portfolio-wide tenant time-in-place questions from lease starts", () => {
    const answer = answerPortfolioQuestion(
      "How long has each tenant been in their house?",
      fixture,
    );

    expect(answer.answer).toBe(
      [
        "Tenant time in place as of 2026-06-17:",
        "Loch Lomand - Avery Johnson: 5 months, 16 days since 2026-01-01.",
        "Verona - Mia Chen: 10 months, 16 days since 2025-08-01.",
        "St. Paul - Noah Patel: 9 months, 2 days since 2025-09-15.",
      ].join("\n\n"),
    );
    expect(answer.citations).toEqual([
      {
        label: "Master spreadsheet row for Loch Lomand",
        href: "/houses/property_loch",
      },
      {
        label: "Master spreadsheet row for Verona",
        href: "/houses/property_verona",
      },
      {
        label: "Master spreadsheet row for St. Paul",
        href: "/houses/property_st_paul",
      },
    ]);
  });

  it("finds lease expirations within 90 days", () => {
    const answer = answerPortfolioQuestion(
      "Which leases expire within 90 days?",
      fixture,
    );

    expect(answer.answer).toContain("Verona expires on 2026-08-01.");
    expect(answer.answer).not.toContain("Loch Lomand");
  });

  it("finds upcoming move-ins within 30 days", () => {
    const answer = answerPortfolioQuestion("Which move-ins are upcoming?", {
      ...fixture,
      properties: [
        ...fixture.properties,
        {
          id: "property_maiden",
          address: "161 Maiden Lane",
          currentTenants: "Elliot Reed",
          rentAmount: "$2,675",
          leaseStart: "2026-06-25",
          leaseEnd: "2027-06-24",
          tenantPhone: "555-0161",
          tenantEmail: "elliot@example.com",
          tenantBirthdays: "Elliot Reed: June 27",
          pets: "No pets",
          owner: "Example Property Group",
          brokerSplit: "70 / 30",
          status: "Active",
          driveFolderUrl: "https://drive.google.com/drive/folders/maiden",
          profile: null,
        },
      ],
    });

    expect(answer.answer).toBe("Upcoming move-ins: 161 Maiden Lane starts on 2026-06-25.");
    expect(answer.citations).toEqual([
      {
        label: "Master spreadsheet row for 161 Maiden Lane",
        href: "/houses/property_maiden",
      },
    ]);
  });

  it("lists vacant properties", () => {
    const answer = answerPortfolioQuestion("Which properties are vacant?", fixture);

    expect(answer.answer).toBe("Vacant properties: Wood Court.");
    expect(answer.citations).toEqual([
      {
        label: "Master spreadsheet row for Wood Court",
        href: "/houses/property_vacant",
      },
    ]);
  });

  it("finds tenant birthdays this month from spreadsheet data", () => {
    const answer = answerPortfolioQuestion(
      "Which tenants have birthdays this month?",
      fixture,
    );

    expect(answer.answer).toBe(
      "Tenant birthdays this month: Loch Lomand - Avery Johnson: June 20.",
    );
    expect(answer.citations).toEqual([
      {
        label: "Master spreadsheet row for Loch Lomand",
        href: "/houses/property_loch",
      },
    ]);
  });

  it("opens a property lease even when the words are not in file-name order", () => {
    const answer = answerPortfolioQuestion("Open the lease for Loch Lomand.", fixture);

    expect(answer.answer).toBe("I found Loch Lomand Lease.");
    expect(answer.citations).toEqual([
      {
        label: "Loch Lomand Lease",
        href: "https://drive.google.com/loch-lease",
      },
    ]);
  });

  it("opens a property Google Drive folder from a natural-language request", () => {
    const answer = answerPortfolioQuestion(
      "Open the Google Drive folder for Loch Lomand.",
      fixture,
    );

    expect(answer.answer).toBe("I found the Google Drive folder for Loch Lomand.");
    expect(answer.citations).toEqual([
      {
        label: "Google Drive folder for Loch Lomand",
        href: "https://drive.google.com/drive/folders/loch",
      },
    ]);
  });

  it("does not invent a Drive folder when the property has none indexed", () => {
    const answer = answerPortfolioQuestion(
      "Open the Google Drive folder for Wood Court.",
      fixture,
    );

    expect(answer.answer).toBe(
      "I could not find that in the indexed spreadsheet or Drive files.",
    );
    expect(answer.citations).toEqual([]);
  });

  it("lists indexed documents and active projects from Drive files", () => {
    const documents = answerPortfolioQuestion(
      "Show me every document for Loch Lomand.",
      fixture,
    );
    const projects = answerPortfolioQuestion("What projects are currently active?", fixture);

    expect(documents.answer).toContain("Loch Lomand Lease");
    expect(documents.answer).toContain("Loch Lomand Dishwasher Repair");
    expect(projects.answer).toBe("I found Wood Court Remodel Scope.");
  });

  it("answers maintenance questions from indexed Drive files", () => {
    const answer = answerPortfolioQuestion(
      "What maintenance has been completed at Loch Lomand?",
      fixture,
    );

    expect(answer.answer).toBe(
      "From Loch Lomand Dishwasher Repair: Dishwasher replaced by Jim's HVAC on 2026-05-10. Warranty expires on 2027-05-10.",
    );
    expect(answer.citations).toEqual([
      {
        label: "Loch Lomand Dishwasher Repair",
        href: "https://drive.google.com/loch-maintenance",
      },
    ]);
  });

  it("does not infer AC replacement needs from generic HVAC records", () => {
    const answer = answerPortfolioQuestion("Which houses need new AC units?", {
      ...fixture,
      properties: [
        ...fixture.properties,
        {
          id: "property_estates",
          address: "Estates",
          currentTenants: "Olivia Martin",
          rentAmount: "$3,150",
          leaseStart: "2026-02-01",
          leaseEnd: "2027-01-31",
          tenantPhone: "555-0181",
          tenantEmail: "olivia@example.com",
          tenantBirthdays: "",
          tenantNotes: "Recent maintenance completed on HVAC.",
          pets: "2 dogs",
          owner: "Example Property Group",
          brokerSplit: "75 / 25",
          status: "Active",
          driveFolderUrl: "https://drive.google.com/drive/folders/estates",
          profile: {
            applianceInfo: "Two HVAC zones. Kitchen fridge replaced in 2025.",
            filterSize: "20x25x4",
            homeWarranty: "Warranty covers HVAC through 2026-11-30.",
            hoaInfo: "HOA requires 48-hour notice for exterior vendors.",
            utilityProviders: "Electric: City Power. Water: Estates Utility District.",
            accessCodes: "Side gate: 7788.",
          },
        },
      ],
      driveFiles: [
        ...fixture.driveFiles,
        {
          id: "drive_estates_maintenance",
          name: "Estates HVAC Maintenance Invoice",
          category: "maintenance",
          webViewLink: "https://drive.google.com/estates-maintenance",
          propertyIndexId: "property_estates",
          textExtract: "HVAC maintenance completed at Estates by Clear Air HVAC.",
        },
      ],
    });

    expect(answer.answer).toBe(
      "I could not find any indexed source saying a property needs a new AC unit. Related HVAC/AC records found for Estates, but none state a replacement need.",
    );
    expect(answer.citations).toEqual([
      {
        label: "Master spreadsheet row for Estates",
        href: "/houses/property_estates",
      },
      {
        label: "Property profile for Estates",
        href: "/houses/property_estates",
      },
      {
        label: "Estates HVAC Maintenance Invoice",
        href: "https://drive.google.com/estates-maintenance",
      },
    ]);
  });

  it("answers AC replacement needs when an indexed source explicitly says so", () => {
    const answer = answerPortfolioQuestion("Which houses need new AC units?", {
      ...fixture,
      properties: [
        ...fixture.properties,
        {
          id: "property_cedar",
          address: "Cedar Place",
          currentTenants: "Riley Brooks",
          rentAmount: "$2,600",
          leaseStart: "2026-03-01",
          leaseEnd: "2027-02-28",
          tenantPhone: "555-0123",
          tenantEmail: "riley@example.com",
          tenantBirthdays: "",
          tenantNotes: "",
          pets: "",
          owner: "Example Property Group",
          brokerSplit: "70 / 30",
          status: "Active",
          driveFolderUrl: "https://drive.google.com/drive/folders/cedar",
          profile: null,
        },
      ],
      driveFiles: [
        ...fixture.driveFiles,
        {
          id: "drive_cedar_ac",
          name: "Cedar Place AC Estimate",
          category: "maintenance",
          webViewLink: "https://drive.google.com/cedar-ac",
          propertyIndexId: "property_cedar",
          textExtract: "AC unit needs replacement before July.",
        },
      ],
    });

    expect(answer.answer).toBe(
      "Indexed AC/HVAC replacement needs: Cedar Place - AC unit needs replacement before July.",
    );
    expect(answer.citations).toEqual([
      {
        label: "Cedar Place AC Estimate",
        href: "https://drive.google.com/cedar-ac",
      },
    ]);
  });

  it("answers financial file questions from indexed Drive files", () => {
    const financial = answerPortfolioQuestion(
      "Show financial files for St. Paul.",
      fixture,
    );
    const ownerStatement = answerPortfolioQuestion(
      "Find the owner statement for St. Paul.",
      fixture,
    );

    expect(financial.answer).toBe("I found St. Paul Owner Statement.");
    expect(ownerStatement.answer).toBe("I found St. Paul Owner Statement.");
    expect(financial.citations).toEqual([
      {
        label: "St. Paul Owner Statement",
        href: "https://drive.google.com/st-paul-financial",
      },
    ]);
  });

  it("lists available templates from indexed template records", () => {
    const answer = answerPortfolioQuestion("What templates are available?", fixture);

    expect(answer.answer).toBe(
      "Available templates: Move-In Checklist, Welcome Letter.",
    );
    expect(answer.citations).toEqual([
      {
        label: "Move-In Checklist",
        href: "/documents?template=template_move_in",
      },
      {
        label: "Welcome Letter",
        href: "/documents?template=template_welcome",
      },
    ]);
  });

  it("opens a mentioned template instead of listing every template", () => {
    const answer = answerPortfolioQuestion(
      "Open the Move-In Checklist template.",
      fixture,
    );

    expect(answer.answer).toBe("I found Move-In Checklist.");
    expect(answer.citations).toEqual([
      {
        label: "Move-In Checklist",
        href: "https://docs.google.com/document/d/template",
      },
    ]);
  });

  it("finds a mentioned template when it is not duplicated as a Drive file", () => {
    const answer = answerPortfolioQuestion("Find the Welcome Letter template.", fixture);

    expect(answer.answer).toBe("I found Welcome Letter.");
    expect(answer.citations).toEqual([
      {
        label: "Welcome Letter",
        href: "/documents?template=template_welcome",
      },
    ]);
  });

  it("answers property document-content questions from indexed text", () => {
    const answer = answerPortfolioQuestion(
      "What does the Loch Lomand maintenance document say about the warranty?",
      fixture,
    );

    expect(answer.answer).toContain("From Loch Lomand Dishwasher Repair:");
    expect(answer.answer).toContain("Warranty expires on 2027-05-10.");
    expect(answer.citations).toEqual([
      {
        label: "Loch Lomand Dishwasher Repair",
        href: "https://drive.google.com/loch-maintenance",
      },
    ]);
  });

  it("answers property profile questions from indexed profile facts", () => {
    const gateCode = answerPortfolioQuestion(
      "What is the gate code at Loch Lomand?",
      fixture,
    );
    const filterSize = answerPortfolioQuestion(
      "What filter size does Loch Lomand use?",
      fixture,
    );

    expect(gateCode.answer).toBe("Codes for Loch Lomand: Gate: 2468. Garage: 1357.");
    expect(gateCode.citations).toEqual([
      {
        label: "Property profile for Loch Lomand",
        href: "/houses/property_loch",
      },
    ]);
    expect(filterSize.answer).toBe("Filter size for Loch Lomand: 16x20x1.");
  });

  it("does not pretend to read a document when no text extract exists", () => {
    const answer = answerPortfolioQuestion(
      "What does the Loch Lomand lease say about pets?",
      fixture,
    );

    expect(answer.answer).toBe(
      "I could not find that in the indexed spreadsheet or Drive files.",
    );
    expect(answer.citations).toEqual([]);
  });

  it("summarizes rental applications from indexed Drive text", () => {
    const answer = answerPortfolioQuestion(
      "Summarize the rental application for Loch Lomand.",
      fixture,
    );

    expect(answer.answer).toBe(
      [
        "Application summary from Loch Lomand Rental Application:",
        "Applicant Avery Johnson reported monthly income of $7,800, one dog, and a requested move-in date of 2026-01-01.",
      ].join("\n\n"),
    );
    expect(answer.citations).toEqual([
      {
        label: "Loch Lomand Rental Application",
        href: "https://drive.google.com/loch-application",
      },
    ]);
  });

  it("does not summarize rental applications when indexed text is unavailable", () => {
    const answer = answerPortfolioQuestion(
      "Summarize the rental application for Loch Lomand.",
      {
        ...fixture,
        driveFiles: fixture.driveFiles.map((file) =>
          file.id === "drive_application"
            ? { ...file, textExtract: undefined }
            : file,
        ),
      },
    );

    expect(answer.answer).toBe(
      "I could not find that in the indexed spreadsheet or Drive files.",
    );
    expect(answer.citations).toEqual([]);
  });

  it("routes document generation requests to a prefilled review flow", () => {
    const answer = answerPortfolioQuestion(
      "Generate a Move-In Checklist for Loch Lomand.",
      fixture,
    );

    expect(answer.answer).toBe(
      "Ready to generate Move-In Checklist for Loch Lomand. Review the fields before creating the document.",
    );
    expect(answer.citations).toEqual([
      {
        label: "Review and generate Move-In Checklist for Loch Lomand",
        href: "/documents?template=template_move_in&property=property_loch",
      },
      {
        label: "Master spreadsheet row for Loch Lomand",
        href: "/houses/property_loch",
      },
    ]);
  });

  it("drafts tenant messages from indexed property data without sending them", () => {
    const answer = answerPortfolioQuestion(
      "Draft a tenant text for Loch Lomand.",
      fixture,
    );

    expect(answer.answer).toBe(
      [
        "Draft tenant text for Loch Lomand:",
        "Hi Avery Johnson, this is operator with Example Property Group about Loch Lomand. I wanted to reach out about the property. Please reply when you have a chance.",
        "Review before sending.",
      ].join("\n\n"),
    );
    expect(answer.citations).toEqual([
      {
        label: "Master spreadsheet row for Loch Lomand",
        href: "/houses/property_loch",
      },
    ]);
  });

  it("drafts owner updates from the indexed property row", () => {
    const answer = answerPortfolioQuestion(
      "Create an owner update for Loch Lomand.",
      fixture,
    );

    expect(answer.answer).toBe(
      [
        "Draft owner update for Loch Lomand:",
        "Example Property Group update: Loch Lomand is currently Active. Tenant(s): Avery Johnson. Rent: $2,450. Lease: 2026-01-01 to 2026-12-31.",
        "Review before sending.",
      ].join("\n\n"),
    );
    expect(answer.citations).toEqual([
      {
        label: "Master spreadsheet row for Loch Lomand",
        href: "/houses/property_loch",
      },
    ]);
  });

  it("drafts notice language with a legal review reminder", () => {
    const answer = answerPortfolioQuestion(
      "Draft a 48-hour notice for Loch Lomand.",
      fixture,
    );

    expect(answer.answer).toBe(
      [
        "Draft 48-hour notice for Loch Lomand:",
        "Avery Johnson, this is a draft notice that Example Property Group intends to enter Loch Lomand after at least 48 hours' notice. Confirm the date, time, reason for entry, and local legal wording before sending.",
        "Review before sending.",
      ].join("\n\n"),
    );
    expect(answer.citations).toEqual([
      {
        label: "Master spreadsheet row for Loch Lomand",
        href: "/houses/property_loch",
      },
    ]);
  });

  it("drafts rent increase notices without inventing a new rent amount", () => {
    const answer = answerPortfolioQuestion(
      "Generate a rent increase notice for Loch Lomand.",
      fixture,
    );

    expect(answer.answer).toBe(
      [
        "Draft rent increase notice for Loch Lomand:",
        "Avery Johnson, this is a draft rent increase notice for Loch Lomand. The current indexed rent is $2,450. Add the new rent amount, effective date, required notice period, and local legal wording before sending.",
        "Review before sending.",
      ].join("\n\n"),
    );
    expect(answer.citations).toEqual([
      {
        label: "Master spreadsheet row for Loch Lomand",
        href: "/houses/property_loch",
      },
    ]);
  });

  it("refuses draft requests when no indexed property is mentioned", () => {
    const answer = answerPortfolioQuestion("Draft a tenant text.", fixture);

    expect(answer.answer).toBe(
      "I could not find that in the indexed spreadsheet or Drive files.",
    );
    expect(answer.citations).toEqual([]);
  });

  it("finds generated document history for a property", () => {
    const answer = answerPortfolioQuestion(
      "Open the generated Move-In Checklist for Loch Lomand.",
      fixture,
    );

    expect(answer.answer).toBe(
      "I found Move-In Checklist - Loch Lomand. Review or print it from Documents.",
    );
    expect(answer.citations).toEqual([
      {
        label: "Move-In Checklist - Loch Lomand",
        href: "/documents?generated=generated_move_in",
      },
    ]);
  });

  it("lists generated documents for a property", () => {
    const answer = answerPortfolioQuestion(
      "Show generated documents for Loch Lomand.",
      fixture,
    );

    expect(answer.answer).toBe(
      "Generated documents for Loch Lomand: Move-In Checklist - Loch Lomand (generated).",
    );
    expect(answer.citations).toEqual([
      {
        label: "Move-In Checklist - Loch Lomand",
        href: "/documents?generated=generated_move_in",
      },
    ]);
  });

  it("answers vendor questions from the indexed vendor directory", () => {
    const vendor = answerPortfolioQuestion("Who is Jim's HVAC?", fixture);
    const properties = answerPortfolioQuestion(
      "Which properties has Jim's HVAC worked on?",
      fixture,
    );
    const contact = answerPortfolioQuestion(
      "What is Jim's HVAC phone number?",
      fixture,
    );

    expect(vendor.answer).toBe(
      "Jim's HVAC is an HVAC vendor. Phone: 555-0188. Email: service@jim.example. Notes: Completed the Loch Lomand dishwasher replacement. License: License on file. Insurance: Insurance on file. Linked properties: Loch Lomand.",
    );
    expect(properties.answer).toBe("Jim's HVAC is linked to Loch Lomand.");
    expect(contact.answer).toBe("The phone number for Jim's HVAC is 555-0188.");
    expect(vendor.citations).toEqual([
      {
        label: "Jim's HVAC",
        href: "/vendors#vendor_jim",
      },
    ]);
  });

  it("answers vendor work-history questions from indexed Drive text", () => {
    const answer = answerPortfolioQuestion(
      "What work has Jim's HVAC completed?",
      fixture,
    );

    expect(answer.answer).toBe("Indexed work for Jim's HVAC: Loch Lomand Dishwasher Repair.");
    expect(answer.citations).toEqual([
      {
        label: "Loch Lomand Dishwasher Repair",
        href: "https://drive.google.com/loch-maintenance",
      },
    ]);
  });

  it("prefers the vendor linked to the mentioned property and trade", () => {
    const answer = answerPortfolioQuestion("Which HVAC vendor works on Estates?", {
      ...fixture,
      properties: [
        ...fixture.properties,
        {
          id: "property_estates",
          address: "Estates",
          currentTenants: "Olivia Martin",
          rentAmount: "$3,150",
          leaseStart: "2026-02-01",
          leaseEnd: "2027-01-31",
          tenantPhone: "555-0181",
          tenantEmail: "olivia@example.com",
          tenantBirthdays: "",
          pets: "2 dogs",
          owner: "Example Property Group",
          brokerSplit: "75 / 25",
          status: "Active",
          driveFolderUrl: "https://drive.google.com/drive/folders/estates",
          profile: null,
        },
      ],
      vendors: [
        ...fixture.vendors,
        {
          id: "vendor_clear_air",
          name: "Clear Air HVAC",
          trade: "HVAC",
          phone: "555-0189",
          email: "service@clearair.example",
          notes: "Use for seasonal maintenance.",
          licenseStatus: "Needs renewal check",
          insuranceStatus: "Insurance on file",
          propertyLinks: [
            {
              id: "property_estates",
              address: "Estates",
            },
          ],
        },
      ],
    });

    expect(answer.answer).toBe("Clear Air HVAC is linked to Estates.");
    expect(answer.citations).toEqual([
      {
        label: "Clear Air HVAC",
        href: "/vendors#vendor_clear_air",
      },
    ]);
  });

  it("refuses to guess when the profile has no answer", () => {
    const answer = answerPortfolioQuestion("What is the gate code at Verona?", fixture);

    expect(answer.answer).toBe(
      "I could not find that in the indexed spreadsheet or Drive files.",
    );
    expect(answer.citations).toEqual([]);
  });
});
