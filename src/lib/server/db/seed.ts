import "dotenv/config";

import db, { schema } from "./index";

async function seedRoles() {
  console.log("🌱 Seeding roles...");

  const roles = [
    {
      id: 1,
      slug: "super_admin",
      rank: "5",
      name: "Super Admin",
      shortDescription: "Full access + Extra",
      description: "Det är endast Kaxig som skall ha denna behörigheten.",
    },
    {
      id: 2,
      slug: "admin",
      rank: "4",
      name: "Admin",
      shortDescription: "Full access",
      description: "Har access till allt.",
    },
    {
      id: 3,
      slug: "manager",
      rank: "3",
      name: "Manager",
      shortDescription: "Access till det mesta",
      description: "Denna behörigheten har access till mycket. Men vissa affärskritiska saker ligger utanför.",
    },
    {
      id: 4,
      slug: "user",
      rank: "2",
      name: "Användare",
      shortDescription: "Vanlig access",
      description: "Har nödvändig access för att utföra sina uppgifter men inte mer.",
    },
    {
      id: 5,
      slug: "guest",
      rank: "1",
      name: "Gäst",
      shortDescription: "Minimal access",
      description: "Kan komma åt vissa specifika saker. Eventuell så kan skrivrättigheter utelämnas mm.",
    },
  ];

  try {
    // Insert roles with explicit IDs
    const insertedRoles = await db.insert(schema.roleTable).values(roles).returning();
    
    console.log("✅ Roles seeded successfully:");
    insertedRoles.forEach(role => {
      console.log(`   ${role.id}: ${role.name} (${role.slug})`);
    });

  } catch (error) {
    console.error("❌ Error seeding roles:", error);
    throw error;
  }
}

async function main() {
  try {
    await seedRoles();
    console.log("🎉 Database seeding completed!");
    process.exit(0);
  } catch (error) {
    console.error("💥 Seeding failed:", error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

export { seedRoles };
