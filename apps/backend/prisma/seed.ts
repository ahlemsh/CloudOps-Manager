import { PrismaClient, RoleName, ProjectStatus, EnvironmentType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱  Seeding database...');

  
  const SALT_ROUNDS = 12;

  const admin = await prisma.user.upsert({
    where: { email: 'admin@cloudops.local' },
    update: {},
    create: {
      email: 'admin@cloudops.local',
      password_hash: await bcrypt.hash('Admin1234!', SALT_ROUNDS),
      first_name: 'Alice',
      last_name: 'Admin',
      role: RoleName.ADMIN,
      is_active: true,
    },
  });

  const devops = await prisma.user.upsert({
    where: { email: 'devops@cloudops.local' },
    update: {},
    create: {
      email: 'devops@cloudops.local',
      password_hash: await bcrypt.hash('Devops1234!', SALT_ROUNDS),
      first_name: 'Bob',
      last_name: 'DevOps',
      role: RoleName.DEVOPS,
      is_active: true,
    },
  });

  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@cloudops.local' },
    update: {},
    create: {
      email: 'viewer@cloudops.local',
      password_hash: await bcrypt.hash('Viewer1234!', SALT_ROUNDS),
      first_name: 'Carol',
      last_name: 'Viewer',
      role: RoleName.VIEWER,
      is_active: true,
    },
  });

  console.log(`  ✅  Users created: ${admin.email}, ${devops.email}, ${viewer.email}`);


  const project = await prisma.project.upsert({
    where: { id: 'seed-project-001' },
    update: {},
    create: {
      id: 'seed-project-001',
      name: 'CloudOps Demo Project',
      description: 'Sample project created by the seed script.',
      status: ProjectStatus.ACTIVE,
      owner_id: admin.id,
    },
  });

  console.log(`  ✅  Project created: ${project.name}`);


  await prisma.projectMember.upsert({
    where: { project_id_user_id: { project_id: project.id, user_id: devops.id } },
    update: {},
    create: { project_id: project.id, user_id: devops.id },
  });

  await prisma.projectMember.upsert({
    where: { project_id_user_id: { project_id: project.id, user_id: viewer.id } },
    update: {},
    create: { project_id: project.id, user_id: viewer.id },
  });

  console.log('  ✅  Project members assigned');


  const envDev = await prisma.environment.create({
    data: {
      name: 'Development',
      type: EnvironmentType.DEVELOPMENT,
      project_id: project.id,
    },
  });

  const envProd = await prisma.environment.create({
    data: {
      name: 'Production',
      type: EnvironmentType.PRODUCTION,
      project_id: project.id,
    },
  });

  console.log(`  ✅  Environments created: ${envDev.name}, ${envProd.name}`);

  console.log('\n🎉  Seed completed successfully!');
}

main()
  .catch((err) => {
    console.error('❌  Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
