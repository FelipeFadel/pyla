import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersModule } from './users.module.js';
import { UsersRepository } from './users.repository.js';

describe('UsersRepository (integração com o Postgres)', () => {
  let prisma: PrismaService;
  let repository: UsersRepository;
  let close: () => Promise<void>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), UsersModule],
    }).compile();
    await moduleRef.init();

    prisma = moduleRef.get(PrismaService);
    repository = moduleRef.get(UsersRepository);
    close = () => moduleRef.close();
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await close();
  });

  it('cria o usuário gratuito com tokenVersion 0', async () => {
    const user = await repository.create({
      email: 'a@x.com',
      passwordHash: 'hash',
    });

    expect(user.email).toBe('a@x.com');
    expect(user.passwordHash).toBe('hash');
    expect(user.tokenVersion).toBe(0);
    expect(user.createdAt).toBeInstanceOf(Date);
  });

  it('recusa o segundo usuário com o mesmo e-mail com P2002', async () => {
    await repository.create({ email: 'a@x.com', passwordHash: 'hash' });

    const error = await repository
      .create({ email: 'a@x.com', passwordHash: 'outro' })
      .catch((e: unknown) => e);

    expect(error).toMatchObject({ code: 'P2002' });
    expect(await prisma.user.count()).toBe(1);
  });
});
