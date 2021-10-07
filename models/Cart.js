module.exports = function Cart(current){
    this.items = current.items || {};
    this.totalQty = current.totalQty || 0;
    this.totalPrice = current.totalPrice || 0;

    this.add = function(item, id){
        let storedItem = this.items[id];
        if(!storedItem){
            storedItem = this.items[id] = {item: item, qty: 0, price: 0};
        }
        storedItem.qty++;
        storedItem.price = storedItem.item.productPrice * storedItem.qty;
        this.totalQty++;
        this.totalPrice += storedItem.item.productPrice;
    };

    this.remove = function(item, id){ 
        storedItem = this.items[id];
        storedItem.qty--;
        storedItem.price = storedItem.item.productPrice * storedItem.qty;
        this.totalQty--;
        this.totalPrice -= storedItem.item.productPrice;
        
    };

    this.generateArray = function(){
        let arr =[];
        for(let id in this.items){
            arr.push(this.items[id]);
        }
        return arr;
    };

};