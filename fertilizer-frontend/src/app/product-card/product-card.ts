import {
  Component,
  Input,
  Output,
  EventEmitter
} from '@angular/core';

@Component({

  selector: 'app-product-card',

  imports: [],

  templateUrl: './product-card.html',

  styleUrl: './product-card.css'

})

export class ProductCard {

  @Input() product: any;

  @Output() increase = new EventEmitter();

  @Output() decrease = new EventEmitter();

  @Output() delete = new EventEmitter();


  increaseStock() {

    this.increase.emit();

  }

  decreaseStock() {

    this.decrease.emit();

  }

  deleteProduct() {

    this.delete.emit();

  }

}