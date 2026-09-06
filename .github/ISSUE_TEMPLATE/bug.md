---
name: 🔴 Bug
about: Um comportamento que já deveria funcionar e não funciona
labels: manutencao
---

<!-- Bug NÃO passa pelo ciclo de spec: o `docs/prd.md` já diz como deveria funcionar,
     e o bug é o desvio. Esta descrição é a especificação dele — por isso ela precisa
     ser detalhada, ao contrário da Issue de história, que só aponta para o PRD. -->

## O que acontece

## O que deveria acontecer

<!-- Cite a story ou a regra do `docs/prd.md`. Se o PRD não diz o que deveria
     acontecer, isto não é bug: é história nova, e volta para o `/utf-prd`. -->

## Passos para reproduzir

1.
2.
3.

## Evidência

<!-- Log, mensagem de erro, print, resposta da API. Sem isso, a correção vira palpite. -->

```
```

## Ambiente

- Onde: local / produção
- Navegador ou cliente:

---

<!-- Ao corrigir: branch a partir da `main`, e o PRIMEIRO commit é um teste que
     reproduz o bug e falha (RED). Sem esse teste, nada prova que o bug foi embora,
     nem que ele não volta. PR com a etiqueta `manutencao` e sem `spec.md`. -->
