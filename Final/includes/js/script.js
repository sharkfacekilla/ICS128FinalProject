//class for creating the catalog of products
class Catalog {
    constructor(id, title, price, description, category, rating, image, quantity) {
        this.id = id;
        this.title = title;
        this.price = price;
        this.description = description;
        this.category = category;
        this.rating = rating;
        this.image = image;
        this.quantity = quantity;
    }
    //setters
    set productID(id) {
        this.id = id;
    }
    set productTitle(title) {
        this.title = title;
    }
    set productPrice(price) {
        this.price = price;
    }
    set productDescription(description) {
        this.description = description;
    }
    set productCategory(category) {
        this.category = category;
    }
    set productRating(rating) {
        this.rating = rating;
    }
    set productImage(image) {
        this.image = image;
    }
    set productQuantity(quantity) {
        this.quantity = quantity;
    }
    //getters
    get productID() {
        return this.id;
    }
    get productTitle() {
        return this.title;
    }
    get productPrice() {
        return this.price;
    }
    get productDescription() {
        return this.description;
    }
    get productCategory() {
        return this.category;
    }
    get productRating() {
        return this.rating;
    }
    get productImage() {
        return this.image;
    }
    get productQuantity() {
        return this.quantity;
    }
}

//global variables
//array for products
let catalogOfProducts = []; //array that will hold the products
let catalogProduct; //single product object
const shipping = 15.0; //flat rate shipping cost
let cartItems; //holding the products
let selectedCurrency; //for the currency api stuff
let currencyValues; //object that will hold the currency vales

//tax rates for provinces
const abTax = 0.05;
const bcTax = 0.12;
const mbTax = 0.12;
const newBrunswickTax = 0.15;
const newfoundlandTax = 0.15;
const nwtTax = 0.05;
const novaScotiaTax = 0.15;
const nunavutTax = 0.05;
const ontarioTax = 0.13;
const peiTax = 0.15;
const quebecTax = 0.14975;
const saskatchewanTax = 0.11;
const yukonTax = 0.05;

const importTax = 0.16; //for fun



//PRODUCT API CALL
const url = `https://fakestoreapi.com/products/`;
const fallbackURL = `https://deepblue.camosun.bc.ca/~c0180354/ics128/final/fakestoreapi.json`;

const currencyURL = `https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/usd.json`;

const callCurrencies = async () => {
    try {
        let response = await fetch(currencyURL);
        let data = await response.json();
        const { usd } = data;
        currencyValues = {
            cadValue: usd.cad,
            usdValue: usd.usd,
            eurValue: usd.eur,
            gbpValue: usd.gbp,
            audValue: usd.aud,
        };
        console.log(currencyValues);
        $(`#dropdownFailMsg`).hide();
    } catch (error) {
        $(`#dropdownBtn`).hide();
        $(`#dropdownFailMsg`).show();
    }
};

const callProducts = async () => {
    try {
        let responseURL = await fetch(url);
        let dataURL = await responseURL.json();

        dataURL.forEach((product) => {
            //creating objects from api call and pushing into array
            catalogProduct = new Catalog(
                product.id,
                product.title,
                product.price,
                product.description,
                product.category,
                product.rating,
                product.image,
                0
            );
            catalogOfProducts.push(catalogProduct);
        });
    } catch (error) {
        try {
            let responseFallback = await fetch(fallbackURL);
            let fallbackData = await responseFallback.json();

            fallbackData.forEach((product) => {
                //creating objects from api call and pushing into array
                catalogProduct = new Catalog(
                    product.id,
                    product.title,
                    product.price,
                    product.description,
                    product.category,
                    product.rating,
                    product.image,
                    0
                );
                catalogOfProducts.push(catalogProduct);
            });
        } catch (fallbackError) {
            console.error(`Fallback failed.`, fallbackError);
        } finally {
            if (catalogOfProducts.length === 0) {
                $(`#featured`).hide();
                $(`#new`).hide();
                $(`#mens`).hide();
                $(`#womens`).hide();
                $(`#electronics`).hide();
                $(`#accessories`).hide();
                $(`#noItemsDiv`).html(
                    `<h2>We're fresh out of stock! Please check back later.</h2>`
                );
            }
        }
    }
};

$(document).ready(function () { //document ready function
    /*     $(`#clearCartBtn`).hide(); */ //show clear cart and checkout buttons
    $(`#checkoutBtn`).hide();
    $(`#clearCartBtn`).hide();
    $(`#offcanvasTableFooter`).hide();
    $(`#offcanvasHeader`).hide();

    //calling functions in this order on page refresh to make sure everything loads correctly
    callProducts()
        .then(() => {
            console.log(catalogOfProducts); //testing purposes, delete this later!!!
        })
        .then(() => {
            callCurrencies();
        })
        .then(() => {
            displayCardInfo();
        })
        .then(() => {
            updateCartCounter();
        })
        .then(() => {
            subtotalCheckoutTable();
        })
        .then(() => {
            checkoutModal();
        });

    $(document).on(`click`, `.addToCart`, function () { //button handler for any addToCart button
        let button = $(this); // storing button clicked into variable for animation use
        let productID = $(this).attr(`data-id`); // getting the product information based on which button was clicked
        cartItems = get_cookie(`shopping_cart_items`); //getting the cookie
        $(`#clearCartBtn`).show(); //show clear cart and checkout buttons
        $(`#checkoutBtn`).show();
        $(`#emptyCart`).hide();
        let product = catalogOfProducts.find( //finding the product within the array
            (item) => item.productID == productID
        );
        if (product) {
            let quantity = cartItems && cartItems[productID] ? cartItems[productID] : 0;
            product.productQuantity += quantity;
        }
        //code from the assignment instructions
        if (cartItems === null) {
            cartItems = {};
        }
        if (cartItems[productID] === undefined) {
            cartItems[productID] = 0;
        }
        cartItems[productID]++;
        set_cookie(`shopping_cart_items`, cartItems);
        set_cookie(`tableHeaderPrepended`, true);
        let quantity = cartItems[productID];
        button.html(`<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Adding...`).attr(`disabled`, true); //button animation for adding to cart

        //setting the values for the card popup
        $(`#cartItemPopupImage`).attr(`src`, product.productImage);
        $(`#cartItemPopupTitle`).html(product.productTitle);
        $(`#cartItemPopupPrice`).html(product.productPrice);
        $(`#cartItemPopupQty`).html(`Added to Cart! Qty (` + quantity + `)`);
        subtotalCheckoutTable(selectedCurrency); //updating totals
        checkoutModal(selectedCurrency);

        //adding a small delay so things don't happen so fast
        setTimeout(function () {
            showCartItemPopup();
            button.html(`Add To Cart`).attr("disabled", false);
        }, 1000);
        setTimeout(function () {
            //updating counter on nav
            updateCartCounter(cartItems);
        }, 1000);
        setTimeout(function () {
            //fade out popup after 5 seconds
            $(`#cartItemPopup`).fadeOut();
        }, 5000);
    });

    $(`#clearCartBtn`).click(function () { //clear cart button handler
        $(`#offcanvasCart`).empty(); //empty table
        $(`#cartCount`).text(`0`); //reset counter
        $(`#emptyCart`).show(); //show empty cart message
        $(`#clearCartBtn`).hide(); //hide buttons
        $(`#checkoutBtn`).hide();
        $(`#offcanvasHeader`).hide(); //remove table header and footer
        $(`#offcanvasTableFooter`).hide();
        set_cookie(`tableHeaderPrepended`, false); //reset cookies
        set_cookie(`tableFooterAppended`, false);
        set_cookie(`shopping_cart_items`, {});
    });

    function updateCurrencyDropdown() { //function that updates the current currency selected
        $(`#currencyDropdown a`).on(`click`, function () {
            $(`#currencyDropdown a`).removeClass(`active`); //removing the active class from all a tags
            $(this).addClass(`active`); //adding active back to the selected a tag
            selectedCurrency = $(this).attr(`data-currency`); //assigning the data-currency for later uses
            displayCardInfo(selectedCurrency); //update the cards and totals with selected currency
            subtotalCheckoutTable(selectedCurrency);
            checkoutModal(selectedCurrency);
        });
    }
    updateCurrencyDropdown(); //calling the function

});

function updateCartCounter(cartItems = get_cookie(`shopping_cart_items`)) { //cart quantity counter on the button in nav
    let cartCount = 0;

    for (let productID in cartItems) {
        cartCount += cartItems[productID];
    }

    $(`#cartCount`).text(cartCount);
}

function showCartItemPopup() { //div that pops up when an item is successfully added to cart
    $(`#cartItemPopup`)
        .fadeIn()
        .css(`display`, `flex`)
        .css(`justify-content`, `center`)
        .css(`align-items`, `center`)
        .css(`flex-direction`, `column`);
}

function displayCardInfo(selectedCurrency) { //displaying cards on the page 
    $(`#featuredCardContainer`).empty(); //makes sure container is empty before adding anything
    let currencySymbol = `$`; //default currency symbol
    for (let i = 0; i < 3; i++) {
        let priceInSelectedCurrency = parseFloat(catalogOfProducts[i].price).toFixed(2); //setting the price fixed to 2 decimal places
        if (selectedCurrency !== `USD`) { //checking what attribute was passed from the button dropdown function
            switch (selectedCurrency) {
                case `CAD`:
                    priceInSelectedCurrency *= currencyValues.cadValue; // assigning the value to the value pulled in from the API
                    currencySymbol = `$`; //set the currency symbol.
                    break;
                case `EUR`:
                    currencySymbol = `€`;
                    priceInSelectedCurrency *= currencyValues.eurValue;
                    break;
            }
            priceInSelectedCurrency = parseFloat(priceInSelectedCurrency).toFixed(2); //making sure this is a number and fixed to 2 decimal places
        }

        //everything below this is the same code, but the only thing changed is the section, and amount of cards displayed in that section

        //featured section
        $(`#featuredCardContainer`) .append(` 
            <div class="col" >
                <div class="card h-100 mb-3" style="max-width:35rem">
                    <div class="row g-0">
                        <div class="col-md-4 mt-auto mb-auto">
                            <img src="${catalogOfProducts[i].image}" class="card-img-top " alt="...">
                        </div>
                        <div class="col-md-8">
                            <div class="card-body">
                                <h5 id="productTitle${i}"class="card-title" data-title="${catalogOfProducts[i].title}">${catalogOfProducts[i].title}</h5>
                                <p class="card-text">${catalogOfProducts[i].description}</p>
                                <p class="card-text">${currencySymbol}${priceInSelectedCurrency}</p>
                                <div class="mt-auto:">
                                    <button class="btn btn-dark addToCart" data-id="${catalogOfProducts[i].id}">Add To Cart</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>            
            </div>`);
    }

    //new arrivals section
    $(`#newCardContainer`).empty();
    for (let i = 9; i < 11; i++) {
        let priceInSelectedCurrency = parseFloat(catalogOfProducts[i].price).toFixed(2);
        if (selectedCurrency !== `USD`) {
            switch (selectedCurrency) {
                case `CAD`:
                    priceInSelectedCurrency *= currencyValues.cadValue;
                    currencySymbol = `$`;
                    break;
                case `EUR`:
                    currencySymbol = `€`;
                    priceInSelectedCurrency *= currencyValues.eurValue;
                    break;
            }
            priceInSelectedCurrency = parseFloat(priceInSelectedCurrency).toFixed(2);
        }
        $(`#newCardContainer`).append(`
            <div class="card mx-auto col-md-4" style="width:25rem">
                <img src="${catalogOfProducts[i].image}" class="card-img-top" alt="...">
                <div class="card-body d-flex flex-column justify-content-between">
                    <h5 id="productTitle${i}"class="card-title" data-title="${catalogOfProducts[i].title}">${catalogOfProducts[i].title}</h5>
                    <p class="card-text">${catalogOfProducts[i].description}</p>
                    <p class="card-text">${currencySymbol}${priceInSelectedCurrency}</p>
                    <div class="mt-auto:">
                        <button class="btn btn-dark addToCart" data-id="${catalogOfProducts[i].id}">Add To Cart</button>
                    </div>
                </div>
            </div>`);
    }

    //mens section
    $(`#mensCardContainer`).empty();
    for (let i = 1; i < 4; i++) {
        let priceInSelectedCurrency = parseFloat(catalogOfProducts[i].price).toFixed(2);
        if (selectedCurrency !== `USD`) {
            switch (selectedCurrency) {
                case `CAD`:
                    priceInSelectedCurrency *= currencyValues.cadValue;
                    currencySymbol = `$`;
                    break;
                case `EUR`:
                    currencySymbol = `€`;
                    priceInSelectedCurrency *= currencyValues.eurValue;
                    break;
            }
            priceInSelectedCurrency = parseFloat(priceInSelectedCurrency).toFixed(2);
        }
        $(`#mensCardContainer`).append(`
            <div class="card mx-auto col-md-4" style="width:25rem">
                <img src="${catalogOfProducts[i].image}" class="card-img-top" alt="...">
                <div class="card-body d-flex flex-column justify-content-between">
                    <h5 id="productTitle${i}"class="card-title" data-title="${catalogOfProducts[i].title}">${catalogOfProducts[i].title}</h5>
                    <p class="card-text">${catalogOfProducts[i].description}</p>
                    <p class="card-text">${currencySymbol}${priceInSelectedCurrency}</p>
                    <div class="mt-auto:">
                        <button class="btn btn-dark addToCart" data-id="${catalogOfProducts[i].id}">Add To Cart</button>
                    </div>
                </div>
            </div>`);
    }

    //accessories section
    $(`#accessoriesCardContainer`).empty();
    for (let i = 4; i < 8; i++) {
        let priceInSelectedCurrency = parseFloat(catalogOfProducts[i].price).toFixed(2);
        if (selectedCurrency !== `USD`) {
            switch (selectedCurrency) {
                case `CAD`:
                    priceInSelectedCurrency *= currencyValues.cadValue;
                    currencySymbol = `$`;
                    break;
                case `EUR`:
                    currencySymbol = `€`;
                    priceInSelectedCurrency *= currencyValues.eurValue;
                    break;
            }
            priceInSelectedCurrency = parseFloat(priceInSelectedCurrency).toFixed(2);
        }
        $(`#accessoriesCardContainer`)
            .append(`<div class="card mx-auto col-md-4" style="width:25rem">
            <img src="${catalogOfProducts[i].image}" class="card-img-top" alt="...">
            <div class="card-body d-flex flex-column justify-content-between">
                <h5 id="productTitle${i}"class="card-title" data-title="${catalogOfProducts[i].title}">${catalogOfProducts[i].title}</h5>
                <p class="card-text">${catalogOfProducts[i].description}</p>
                <p class="card-text">${currencySymbol}${priceInSelectedCurrency}</p>
                <div class="mt-auto:">
                    <button class="btn btn-dark addToCart" data-id="${catalogOfProducts[i].id}">Add To Cart</button>
                </div>
            </div>
        </div>`);
    }

    //womens section
    $(`#womensCardContainer`).empty();
    for (let i = 14; i < 20; i++) {
        let priceInSelectedCurrency = parseFloat(catalogOfProducts[i].price).toFixed(2);
        if (selectedCurrency !== `USD`) {
            switch (selectedCurrency) {
                case `CAD`:
                    priceInSelectedCurrency *= currencyValues.cadValue;
                    currencySymbol = `$`;
                    break;
                case `EUR`:
                    currencySymbol = `€`;
                    priceInSelectedCurrency *= currencyValues.eurValue;
                    break;
            }
            priceInSelectedCurrency = parseFloat(priceInSelectedCurrency).toFixed(2);
        }
        $(`#womensCardContainer`)
            .append(`<div class="card mx-auto col-md-4" style="width:25rem">
            <img src="${catalogOfProducts[i].image}" class="card-img-top" alt="...">
            <div class="card-body d-flex flex-column justify-content-between">
                <h5 id="productTitle${i}"class="card-title" data-title="${catalogOfProducts[i].title}">${catalogOfProducts[i].title}</h5>
                <p class="card-text">${catalogOfProducts[i].description}</p>
                <p class="card-text">${currencySymbol}${priceInSelectedCurrency}</p>
                <div class="mt-auto:">
                    <button class="btn btn-dark addToCart" data-id="${catalogOfProducts[i].id}">Add To Cart</button>
                </div>
            </div>
        </div>`);
    }

    //electronics section
    $(`#electronicsCardContainer`).empty();
    for (let i = 9; i < 14; i++) {
        let priceInSelectedCurrency = parseFloat(catalogOfProducts[i].price).toFixed(2);
        if (selectedCurrency !== `USD`) {
            switch (selectedCurrency) {
                case `CAD`:
                    priceInSelectedCurrency *= currencyValues.cadValue;
                    currencySymbol = `$`;
                    break;
                case `EUR`:
                    currencySymbol = `€`;
                    priceInSelectedCurrency *= currencyValues.eurValue;
                    break;
            }
            priceInSelectedCurrency = parseFloat(priceInSelectedCurrency).toFixed(2);
        }
        $(`#electronicsCardContainer`).append(`
        <div class="card mx-auto col-md-4" style="width:25rem">
            <img src="${catalogOfProducts[i].image}" class="card-img-top" alt="...">
            <div class="card-body d-flex flex-column justify-content-between">
                <h5 id="productTitle${i}"class="card-title" data-title="${catalogOfProducts[i].title}">${catalogOfProducts[i].title}</h5>
                <p class="card-text">${catalogOfProducts[i].description}</p>
                <p class="card-text">${currencySymbol}${priceInSelectedCurrency}</p>
                <div class="mt-auto:">
                    <button class="btn btn-dark addToCart" data-id="${catalogOfProducts[i].id}">Add To Cart</button>
                </div>
            </div>
        </div>`);
    }
}

$(`#offcanvasCart`).on(`click`, `button`, function () { //removing an item from the cart function
    cartItems = get_cookie(`shopping_cart_items`); //get the cookie
    let productID = $(this).data(`id`); //get the product id based off the button that was clicked
    delete cartItems[productID]; //remove the item from the cart object
    set_cookie(`shopping_cart_items`, cartItems); //set the cookie with the updated cart object
    subtotalCheckoutTable(selectedCurrency); //update subtotals
    updateCartCounter(selectedCurrency);
});

function subtotalCheckoutTable(selectedCurrency) { //function to update the subtotal in the offcanvas table
    let currencySymbol = `$`; //setting the currency symbol to USD
    cartItems = get_cookie(`shopping_cart_items`); //grab cookie
    if (cartItems === null || cartItems === undefined) { //check if the cart is empty, if so, make an empty object
        cartItems = {};
    }
    $(`#offcanvasCart`).empty(); //clearing the table before appending a new item
    for (let productID in cartItems) { //iterating through the cart object
        if (cartItems.hasOwnProperty(productID)) { //if the cart object has the product id, assign it to product, 
            let product = catalogOfProducts.find((item) => item.productID == productID); //finding the item in the catalog of products, using an arrow testing function that will compare the productID property of each item in the catalogOfProducts array

            if (product) { //if the product exists
                let quantity = cartItems[productID]; //getting the quantity of that product
                let prodCost = product.productPrice; //getting the price of that product


                if (selectedCurrency !== `USD`) { //if the currency is not USD, then check to see which selectedCurrency value was passed, and then calculate the appropriate cost from the currencyValues object
                    switch (selectedCurrency) {
                        case `CAD`:
                            prodCost *= currencyValues.cadValue;
                            currencySymbol = `$`;
                            break;
                        case `EUR`:
                            prodCost *= currencyValues.eurValue;
                            currencySymbol = `€`;
                            break;
                    }
                }
                prodCost = parseFloat(prodCost).toFixed(2); //making sure that the cost is a number with 2 decimal places.
                let subtotal = prodCost * quantity; //calculate subtotal
                $(`#emptyCart`).hide(); //hide the empty cart message
                //assigning the row to a variable
                let row = `
                    <tr>
                        <th><button style="border: none;" data-id="${product.productID}"><i class="bi bi-trash3-fill" style="color:red;"></i></button></th>
                        <td scope="col">${product.productTitle}</td>
                        <td scope="col">${currencySymbol}${prodCost}</td>
                        <td scope="col">${quantity}</td>
                        <td scope="col">${currencySymbol}${subtotal.toFixed(2)}</td>
                    </tr>`;
                $(`#offcanvasHeader`).show(); //show the table header
                $(`#offcanvasCart`).append(row); //append the newly created row
                $(`#clearCartBtn`).show(); //show the buttons
                $(`#checkoutBtn`).show();
            }
        }
    }

    //similar to above, but just for the footer of the table. nothing really different here except where it's getting displayed
    $(`#offcanvasTableFooter`).empty(); 
    let cartSubtotal = 0; //initially set the subtotal to 0

    for (let productID in cartItems) { //same as above, iterating through the cart
        if (cartItems.hasOwnProperty(productID)) {
            let product = catalogOfProducts.find((item) => item.productID == productID);

            if (product) {
                let prodQuantity = cartItems[productID];
                let prodCost = product.productPrice;

                if (selectedCurrency !== `USD`) {
                    switch (selectedCurrency) {
                        case `CAD`:
                            prodCost *= currencyValues.cadValue;
                            currencySymbol = `$`;
                            break;
                        case `EUR`:
                            prodCost *= currencyValues.eurValue;
                            currencySymbol = `€`;
                            break;
                    }
                }
                prodCost = parseFloat(prodCost).toFixed(2);
                cartSubtotal += prodCost * prodQuantity;
            }
        }
    }
    if (Object.keys(cartItems).length > 0) { //making sure the cart is not empty, and if it is, don't show the subtotal row
        let subtotalRow = `
            <tr>
                <th colspan="4">Subtotal</td>
                <td scope="col">${currencySymbol}${cartSubtotal.toFixed(2)}</td>
            </tr>`;
        $(`#offcanvasTableFooter`).show();
        $(`#offcanvasTableFooter`).append(subtotalRow);
    } else {
        $(`#offcanvasHeader`).hide();
        $(`#emptyCart`).show();
        $(`#clearCartBtn`).hide();
        $(`#checkoutBtn`).hide();
        $(`#offcanvasTableFooter`).hide();
    }
}

function checkoutModal(selectedCurrency) { //similar to the subtotalCheckoutTable, nothing really different here, except where the rows are appeneded
    cartItems = get_cookie(`shopping_cart_items`);
    let currencySymbol = `$`;
    if (cartItems === null || cartItems === undefined) {
        cartItems = {};
    }
    $(`#checkoutTable`).empty();
    for (let productID in cartItems) {
        if (cartItems.hasOwnProperty(productID)) {
            let product = catalogOfProducts.find((item) => item.productID == productID);

            if (product) {
                let itemQuantity = cartItems[productID];
                let productCost = product.productPrice;

                if (selectedCurrency !== `USD`) {
                    switch (selectedCurrency) {
                        case `CAD`:
                            productCost *= currencyValues.cadValue;
                            currencySymbol = `$`;
                            break;
                        case `EUR`:
                            productCost *= currencyValues.eurValue;
                            currencySymbol = `€`;
                            break;
                    }
                    productCost = parseFloat(productCost).toFixed(2);
                }
                let productSubtotal = productCost * itemQuantity;
                productSubtotal = parseFloat(productSubtotal).toFixed(2);
                let row = `
                    <tr>
                        <td scope="col">${product.productTitle}</td>
                        <td scope="col">${currencySymbol}${productCost}</td>
                        <td scope="col">${itemQuantity}</td>
                        <td scope="col">$${productSubtotal}</td>
                    </tr>`;
                $(`#checkoutHeader`).show();
                $(`#checkoutTable`).append(row);
            }
        }
    }

    $(`#checkoutFooter`).empty();
    let cartSubtotal = 0;
    for (let productID in cartItems) {
        if (cartItems.hasOwnProperty(productID)) {
            let product = catalogOfProducts.find((item) => item.productID == productID
            );
            if (product) {
                let cartQuantity = cartItems[productID];
                let cartCost = product.productPrice;

                if (selectedCurrency !== `USD`) {
                    switch (selectedCurrency) {
                        case `CAD`:
                            cartCost *= currencyValues.cadValue;
                            currencySymbol = `$`;
                            break;
                        case `EUR`:
                            cartCost *= currencyValues.eurValue;
                            currencySymbol = `€`;
                            break;
                    }
                    cartCost = parseFloat(cartCost).toFixed(2);
                }
                cartSubtotal += cartCost * cartQuantity;
                cartSubtotal = parseFloat(cartSubtotal).toFixed(2);
            }
        }
    }

    if (Object.keys(cartItems).length > 0) {
        let tax = 0.07 * cartSubtotal;
        let grandTotal = cartSubtotal + tax + shipping;
        grandTotal = parseFloat(grandTotal).toFixed(2);
        let grandtotalRow = `
            <tr>
                <td scope="col" colspan="3">Subtotal</th>
                <td scope="col">${currencySymbol}${cartSubtotal}</td>
            </tr>
            <tr>
                <td scope="col" colspan="3">Tax</td>
                <td scope="col">${currencySymbol}${tax.toFixed(2)}</td>
            </tr>
            <tr>
                <td scope="col" colspan="3">Shipping</td>
                <td scope="col">${currencySymbol}${shipping.toFixed(2)}</td>
            </tr>
            <tr>
                <th scope="col" colspan="3">Total</th>
                <th scope="col">${currencySymbol}${grandTotal}</th>
            </tr>`;
        $(`#checkoutFooter`).show();
        $(`#checkoutFooter`).append(grandtotalRow);
    } else {
        $(`#checkoutFooter`).hide();
    }
}
//the end.