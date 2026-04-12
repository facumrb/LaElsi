import { Component, signal } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { bootstrapChevronDown } from '@ng-icons/bootstrap-icons';

interface FaqItem {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-faq-page',
  imports: [NgIconComponent],
  viewProviders: [
    provideIcons({
      bootstrapChevronDown,
    }),
  ],
  templateUrl: './faq-page.component.html',
})
export class FaqPageComponent {
  faqs: FaqItem[] = [
    {
      question: '¿Cómo realizo una compra en Laelsi?',
      answer:
        'Elegí los productos que necesitás, agregalos al carrito y seguí el proceso de compra. Podés comprar como usuario registrado o continuar como invitado. Una vez confirmado el pago, recibirás un email con los detalles de tu pedido.',
    },
    {
      question: '¿Realizan envíos a todo el país?',
      answer:
        'Sí, realizamos envíos a todo el territorio argentino. Trabajamos con servicios de correo confiables para que tu pedido llegue de forma segura y en el menor tiempo posible.',
    },
    {
      question: '¿Cuáles son los medios de pago disponibles?',
      answer:
        'Aceptamos tarjetas de débito y crédito, transferencias bancarias y otros medios de pago electrónicos habilitados en nuestra tienda. Todas las operaciones se realizan en un entorno seguro.',
    },
    {
      question: '¿Puedo retirar mi compra en el local?',
      answer:
        'Sí, podés optar por retirar tu pedido en nuestro local de Rosario. Una vez que la compra esté lista, te avisaremos para que puedas pasar a buscarla.',
    },
    {
      question: '¿Qué hago si tengo un problema con mi pedido?',
      answer:
        'Si tu pedido llega con algún inconveniente o tenés una consulta adicional, podés comunicarte con nuestro equipo de atención al cliente. Vamos a ayudarte para resolverlo lo antes posible.',
    },
  ];

  openIndex = signal<number | null>(null);

  toggleFaq(index: number): void {
    if (this.openIndex() === index) {
      this.openIndex.set(null);
    } else {
      this.openIndex.set(index);
    }
  }
}
