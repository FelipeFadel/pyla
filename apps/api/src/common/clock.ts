import { Injectable } from '@nestjs/common';

// Dia calendário (YYYY-MM-DD) de um instante em America/Sao_Paulo.
export function dateInSaoPaulo(instant: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
  }).format(instant);
}

// Relógio injetável: o e2e troca este provider para fixar o instante e não
// depender do dia em que a suíte roda.
@Injectable()
export class Clock {
  now(): Date {
    return new Date();
  }
}
