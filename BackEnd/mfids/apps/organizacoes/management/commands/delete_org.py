from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User
from apps.organizacoes.models import Organizacao, UserOrganizacoes, Contato
from apps.equipamentos.models import Equipamento


class Command(BaseCommand):
    help = "Apaga organizações (P/G/PG) e todos os dados associados pelo ID."

    def add_arguments(self, parser):
        parser.add_argument(
            "ids",
            nargs="+",
            type=int,
            help="IDs das organizações a apagar (ex: 291 292)",
        )
        parser.add_argument(
            "--confirm",
            action="store_true",
            help="Confirmar a eliminação sem prompt interactivo",
        )

    def handle(self, *args, **options):
        org_ids = options["ids"]

        orgs = Organizacao.objects.filter(id__in=org_ids)
        if not orgs.exists():
            raise CommandError(f"Nenhuma organização encontrada com IDs: {org_ids}")

        self.stdout.write("Organizações a apagar:")
        for org in orgs:
            self.stdout.write(f"  [{org.id}] {org.nome} ({org.tipo_organizacao})")

        if not options["confirm"]:
            resposta = input("\nConfirmar eliminação? (s/N): ").strip().lower()
            if resposta != "s":
                self.stdout.write(self.style.WARNING("Operação cancelada."))
                return

        # Incluir filhos (gestores cujo parent_id é um dos IDs fornecidos)
        filhos_ids = list(
            Organizacao.objects.filter(parent_id__in=org_ids).values_list("id", flat=True)
        )
        todos_ids = list(set(org_ids + filhos_ids))
        if filhos_ids:
            self.stdout.write(f"Organizações filhas incluídas: {filhos_ids}")

        # Utilizadores ligados (PR-xxx / GS-xxx via UserOrganizacoes)
        usernames = list(
            UserOrganizacoes.objects.filter(organizacao_id__in=todos_ids)
            .exclude(user=None)
            .values_list("user__username", flat=True)
        )

        # 1. Equipamentos com FK para estas orgs
        n_equip, _ = Equipamento.objects.filter(gestor_id__in=todos_ids).delete()
        self.stdout.write(f"Equipamentos apagados: {n_equip}")

        # 2. UserOrganizacoes (DO_NOTHING — apagar antes das orgs)
        n_uo, _ = UserOrganizacoes.objects.filter(organizacao_id__in=todos_ids).delete()
        self.stdout.write(f"UserOrganizacoes apagados: {n_uo}")

        # 3. Contatos (guardar IDs antes de apagar as orgs)
        contato_ids = list(
            Organizacao.objects.filter(id__in=todos_ids).values_list("contato_id", flat=True)
        )

        # 4. Orgs — filhos primeiro, depois pais
        Organizacao.objects.filter(id__in=filhos_ids).delete()
        Organizacao.objects.filter(id__in=org_ids).delete()
        self.stdout.write(f"Organizações apagadas: {todos_ids}")

        # 5. Contatos órfãos
        n_cont, _ = Contato.objects.filter(id__in=[c for c in contato_ids if c]).delete()
        self.stdout.write(f"Contatos apagados: {n_cont}")

        # 6. Utilizadores (cascata apaga Profile, grupos e permissões)
        n_users, detail = User.objects.filter(username__in=usernames).delete()
        self.stdout.write(f"Utilizadores apagados: {n_users} {detail}")

        self.stdout.write(self.style.SUCCESS("Concluído."))
