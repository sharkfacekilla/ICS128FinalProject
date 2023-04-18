//script purely for handling the validation of the checkout field... thought putting it on it's own was a smart thing to do since it's big

//I decided to add two validation methods, one to check while the user is typing and give real time feedback, and another when the user clicks the submit button

//regex
const regFirstName = /^[a-zA-Z]+$/;
const regLastName = /^[a-zA-Z-]+$/;
const regAddress = /^(\d+)\s+([\w\s]+?)\s+(?:(?:(?:Avenue|Ave|Street|St|Road|Rd|Lane|Ln|Drive|Dr|Boulevard|Blvd|Court|Ct|Place|Pl|Square|Sq|Terrace|Ter|Trail|Trl|Highway|Hwy)\b)|([\w\s]+))$/i;
const regSecondAddress = /(?:\b(?:2nd|Second|Basement|Suite|Apt|Apartment|Unit|Room|Studio)\b)\s*([\w\s]+)/i; //for optional field
const regCity =  /^[a-zA-Z]+(?:\s[a-zA-Z]+)*$/;
const regEmail = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
const canRegPostal = /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d$/i;
const usaRegPostal = /^\d{5}$/;
const regPhone = /^(\d{3}[- ]?\d{3}[- ]?\d{4}|\(\d{3}\)\s*\d{3}[- ]?\d{4}|\d{3}[- ]?\d{7})$/;
const cvcRegex = /^\d{3}$/; 
const ccRegex = /^(\d{4}\s\d{4}\s\d{4}\s\d{4}|\d{16})$/;
const monthRegex = /^(0[1-9]|1[0-2]|10|11|12)$/;
const yearRegex = /^(?:20)\d\d$/;
const currentYear = new Date().getFullYear(); //get current date for credit card validaton later
const currentMonth = new Date().getMonth() + 1;
const submission = {};

let billingFirstName;
let billingLastName;
let billingAddress;
let billingAddress2;
let billingCountry;
let billingProvince;
let billingCity;
let billingPostalCode;
let billingPhone;
let billingEmail;
let billingCcNumber;
let billingCcMonth;
let billingCcYear;
let billingCvc;

let shippingFirstName;
let shippingLastName;
let shippingAddress;
let shippingAddress2;
let shippingCountry;
let shippingProvince;
let shippingCity;
let shippingPostalCode;
let shippingPhone;
let shippingEmail;

let isBillingFormValid = false;
let isShippingFormValid = false;
let isCreditCardFormValid = false;
let grandTotal;
let currency;
let form_data = new FormData();

const submitFunction = async(form_data) => {
    try {
        let response = await fetch(`https://deepblue.camosun.bc.ca/~c0180354/ics128/final/`,
        { method: `POST`,
        cache: `no-cache`,
        body: form_data
    }); 
    if (response.ok) {
        const data = await response.json();
        console.log(data);
    }
    }
    catch(error) {
        console.error(`${error}`)
    }
}

$(document).ready(function() {

    $(`#submitOrderBtn`).hide(); //initially hiding these buttons
    $(`#backBtn`).hide();
    $(`#submitOrderError`).hide();

        // continue/back button logic in the checkout modal
        $(`#continueBtn`).click(function() {
            let currentLink = $(`.nav-link.active`);
            let nextLink = currentLink.closest(`li.nav-item`).next().find(`.nav-link`);
            let targetTab = $(nextLink.attr(`data-bs-target`));
    
            if (nextLink.attr(`id`) === `pills-confirmation-tab`) {
                $(`#submitOrderBtn`).show();
                $(`#continueBtn`).hide();
            }
    
            currentLink.removeClass(`active`);
            nextLink.addClass(`active`);
            $(`.tab-pane`).removeClass(`show active`);
            targetTab.addClass(`show active`);
            nextLink.trigger(`click`);
        });
    
        $(`#backBtn`).click(function() {
            let currentLink = $(`.nav-link.active`);
            let prevLink = currentLink.closest(`li.nav-item`).prev().find(`.nav-link`);
            let targetTab = $(prevLink.attr(`data-bs-target`));
    
            if (prevLink.attr(`id`) === `pills-billing-tab`) {
                $(`#backBtn`).hide();
            }
            else {
                $(`#backBtn`).show();
            }
    
            currentLink.removeClass(`active`);
            prevLink.addClass(`active`);
            $(`.tab-pane`).removeClass(`show active`);
            targetTab.addClass(`show active`);
            prevLink.trigger(`click`);
        });
    
        //if the same information as billing checkbox is checked, hides the shipping form and assigns the info into the shipping variables.
        $(`#sameInfo`).click(function() {
            if ($(`#sameInfo`).prop(`checked`)) {
                $(`#shippingForm`).hide();
                shippingFirstName = billingFirstName;
                shippingLastName = billingLastName;
                shippingAddress = billingAddress;
                shippingAddress2 = billingAddress2;
                shippingCountry = billingCountry;
                shippingProvince = billingProvince;
                shippingCity = billingCity;
                shippingPostalCode = billingPostalCode;
                shippingPhone = billingPhone;
                shippingEmail = billingEmail;
                isShippingFormValid = true;
            }
            else {
                shippingFirstName = ``;
                shippingLastName = ``;
                shippingAddress = ``;
                shippingAddress2 = ``;
                shippingCountry = ``;
                shippingProvince = ``;
                shippingCity = ``;
                shippingPostalCode = ``;
                shippingPhone = ``;
                shippingEmail = ``;
                isShippingFormValid = false;
                $(`#shippingForm`).show();
            }
        });
    
        //create a delay function to simulate submitting
        function delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    
        //submit orderbutton handler
        $(`#submitOrderBtn`).click(function() {
            $(`#submitOrderError`).hide(); //hide error message if it's showing
/*             billingProvince = $(`#billingProvince`).val();
            shippingProvince = billingProvince; */
            setTimeout(function() {
                billingValidate();
                shippingValidate();
                validateCreditCard();
            }, 2000)
    
            //close modal and display success message if all forms are valid
            if (isShippingFormValid && isCreditCardFormValid && isBillingFormValid) {
                $(`#submitOrderBtn`).html(`<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Submitting...`);
                delay(2000).then(() => { //creating a delay to simulate submission
                    billingCcNumber = billingCcNumber.replace(/\s/g, ``);
                    if (!shippingPhone.match(billingPhone)) {
                        shippingPhone = shippingPhone.replace(/\s/g, ``);
                    }
                    billingPhone = billingPhone.replace(/\s/g, ``);
                    submission.card_number = billingCcNumber;
                    submission.expiry_month = billingCcMonth; 
                    submission.expiry_year = billingCcYear;
                    submission.security_code = billingCvc;
                    grandTotal = $(`#grandTotal`).text();
                    grandTotal =  parseFloat(grandTotal.replace(/[^\d.-]/g, ``));
                    grandTotal = grandTotal.toFixed(2);
                    submission.amount = grandTotal;
                    currency = $(`#currencyDropdown .dropdown-item.active`).data(`currency`);
                    currency = currency.toLowerCase();
                    submission.currency = currency;
                    billingCountry = billingCountry.slice(0,-1);
                    shippingCountry = shippingCountry.slice(0,-1);
                    let newBillingObj = {
                        first_name: billingFirstName,
                        last_name: billingLastName,
                        address_1: billingAddress,
                        address_2: billingAddress2,
                        city: billingCity,
                        province: billingProvince,
                        country: billingCountry,
                        postal: billingPostalCode,
                        phone: billingPhone,
                        email: billingEmail
                    }
                    let newShippingObj = {
                        first_name: shippingFirstName,
                        last_name: shippingLastName,
                        address_1: shippingAddress,
                        address_2: shippingAddress2,
                        city: shippingCity,
                        province: shippingProvince,
                        country: shippingCountry,
                        postal: shippingPostalCode,
                        phone: shippingPhone,
                        email: shippingEmail
                    }
                    submission.billing = newBillingObj;
                    submission.shipping = newShippingObj;
                    form_data.append(`submission`, JSON.stringify(submission));
                    console.log(submission);
                    for (let pair of form_data.entries()) {
                        console.log(pair[0] + ': ' + pair[1]);
                    }
                    submitFunction(form_data);


                    $(`#checkoutModal`).modal(`hide`);
                    $(`#successModal`).modal(`show`);
                    $(`#submitOrderBtn`).html(`Submit Order`);
                    cartItems = get_cookie(`shopping_cart_items`);
                    for (let productID in cartItems) {
                        if (cartItems.hasOwnProperty(productID)) {
                            delete cartItems[productID];
                        }
                    }
                    set_cookie(`shopping_cart_items`, cartItems);
                    updateCartCounter(selectedCurrency);
                    subtotalCheckoutTable(selectedCurrency);
                    checkoutModal(selectedCurrency);
                    console.log(cartItems);
                }).catch((error) => {
                    $(`#submitOrderError`).html(error);
                    $(`#submitOrderBtn`).html(`Submit Order`);
                });
            }
            else {
                $(`#submitOrderBtn`).html(`<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Submitting...`);
                delay(2000).then(() => {
                    $(`#submitOrderError`).show();
                    $(`#submitOrderBtn`).html(`Submit Order`);
                }).catch(error => {
                    $(`#submitOrderError`).html(error);
                    $(`#submitOrderBtn`).html(`Submit Order`);
                });
            }
        });
    

    //FIRST VALIDATION METHOD: VALIDATING ON BUTTON CLICK

    //functions to validate fields on submit order button click
    function billingValidate() {
        //getting values from inputs
        billingFirstName = $(`#billingFirstName`).val();
        billingLastName = $(`#billingLastName`).val();
        billingAddress = $(`#billingAddress`).val();
        billingCountry = $(`#billingCountry`).val();
        billingProvince = $(`#billingProvince`).val();
        billingCity = $(`#billingCity`).val();
        billingPostalCode = $(`#billingZip`).val();
        billingPhone = $(`#billingPhone`).val();
        billingEmail = $(`#billingEmail`).val();

        //going through and checking if fields are either empty, or match the regex, and display feedback appropriately
        //first name
        if (billingFirstName === ``) {
            $(`#billingFirstName`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
            $(`#billingFirstName`).siblings(`.invalid-feedback`).text(`Please enter your first name`);
            isBillingFormValid = false;
        }
        else if (billingFirstName.match(regFirstName)) {
            $(`#billingFirstName`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isBillingFormValid = true;
        }
        else {
            $(`#billingFirstName`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            isBillingFormValid = false;
        }

        //last name
        if (billingLastName === ``) {
            $(`#billingLastName`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
            $(`#billingLastName`).siblings(`.invalid-feedback`).text(`Please enter your last name`);
            isBillingFormValid = false;
        }
        else if (billingLastName.match(regLastName)) {
            $(`#billingLastName`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isBillingFormValid = true;
        }
        else {
            $(`#billingLastName`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            isBillingFormValid = false;
        }

        //address
        if (billingAddress === ``) {
            $(`#billingAddress`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
            $(`#billingAddress`).siblings(`.invalid-feedback`).text(`Please enter your address`);
            isBillingFormValid = false;
        }
        else if (billingAddress.match(regAddress)) {
            $(`#billingAddress`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isBillingFormValid = true;
        }
        else {
            $(`#billingAddress`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            isBillingFormValid = false;
        }

        //country
        if (billingCountry === null) {
            $(`#billingCountry`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
            $(`#billingCountry`).siblings(`.invalid-feedback`).text(`Please select a country`);
            isBillingFormValid = false;
        }
        else {
            if (billingCountry === `CAD` && billingPostalCode.match(canRegPostal)) {
                $(`#billingCountry`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
                isBillingFormValid = true;
            }
            else {
                $(`#billingCountry`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
                $(`#billingCountry`).siblings(`.invalid-feedback`).text(`Country/Postal mismatch`);
                $(`#billingZip`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
                $(`#billingZip`).siblings(`.invalid-feedback`).text(`Country/Postal mismatch`);
                isBillingFormValid = false;
            }
        }

        //province/state
        if (billingProvince === null) {
            if (billingCountry === `CAD`) {
                $(`#billingProvince`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
                $(`#billingProvince`).siblings(`.invalid-feedback`).text(`Please select a province`);
                isBillingFormValid = false;
            }
            else {
                $(`#billingProvince`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
                $(`#billingProvince`).siblings(`.invalid-feedback`).text(`Please select a state`);
                isBillingFormValid = false;
            }
        }
        else {
            $(`#billingProvince`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isBillingFormValid = true;
        }

        //city
        if (billingCity === ``) {
            $(`#billingCity`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
            $(`#billingCity`).siblings(`.invalid-feedback`).text(`Please enter your city`);
            isBillingFormValid = false;
        }
        else if (billingCity.match(regCity)) {
            $(`#billingCity`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isBillingFormValid = true;
        }
        else {
            $(`#billingCity`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            isBillingFormValid = false;
        }

        //postal/zip
        if (billingPostalCode === ``) {
            $(`#billingZip`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
            $(`#billingZip`).siblings(`.invalid-feedback`).text(`Please enter your postal code`);
            isBillingFormValid = false;
        }
        else 
            if (billingCountry === `CAD` && billingPostalCode.match(canRegPostal)){
                $(`#billingZip`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
                isBillingFormValid = true;
            }
            else if (billingCountry === `USA` && billingPostalCode.match(usaRegPostal)) {
                $(`#billingZip`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
                isBillingFormValid = true;
            }
            else {
                $(`#billingZip`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
                isBillingFormValid = false;
            }

        //phone
        if (billingPhone === ``) {
            $(`#billingPhone`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
            $(`#billingPhone`).siblings(`.invalid-feedback`).text(`Please enter your phone number`);
            isBillingFormValid = false;
        }
        else if (billingPhone.match(regPhone)) {
            $(`#billingPhone`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isBillingFormValid = true;
        }
        else {
            $(`#billingZip`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            isBillingFormValid = false;
        }

        //email
        if (billingEmail === ``) {
            $(`#billingEmail`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
            $(`#billingEmail`).siblings(`.invalid-feedback`).text(`Please enter your email`);
            isBillingFormValid = false;
        }
        else if (billingEmail.match(regEmail)) {
            $(`#billingEmail`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isBillingFormValid = true;
        }
        else {
            $(`#billingEmail`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            isBillingFormValid = false;
        }
    }

    //shipping form validation (same as above, copy pasted and changed the variables to be appropriate)
    function shippingValidate() {
        //getting values from inputs, exact same as above
        if (!$(`#sameInfo`).prop(`checked`)) {
            shippingFirstName = $(`#shippingFirstName`).val();
            shippingLastName = $(`#shippingLastName`).val();
            shippingAddress = $(`#shippingAddress`).val();
            shippingCountry = $(`#shippingCountry`).val();
            shippingProvince = $(`#shippingProvince`).val();
            shippingCity = $(`#shippingCity`).val();
        shippingPostalCode = $(`#shippingZip`).val();
            shippingPhone = $(`#shippingPhone`).val();
            shippingEmail = $(`#shippingEmail`).val();
        }
        //going through and checking if fields are either empty, or match the regex.
        //first name
        if (shippingFirstName === ``) {
            $(`#shippingFirstName`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
            $(`#shippingFirstName`).siblings(`.invalid-feedback`).text(`Please enter your first name`);
            isShippingFormValid = false;
        }
        else if (shippingFirstName.match(regFirstName)) {
            $(`#shippingFirstName`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isShippingFormValid = true;
        }
        else {
            $(`#shippingFirstName`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            isShippingFormValid = false;
        }

        //last name
        if (shippingLastName === ``) {
            $(`#shippingLastName`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
            $(`#shippingLastName`).siblings(`.invalid-feedback`).text(`Please enter your last name`);
            isShippingFormValid = false;
        }
        else if (shippingLastName.match(regLastName)) {
            $(`#shippingLastName`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isShippingFormValid = true;
        }
        else {
            $(`#shippingLastName`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            isShippingFormValid = false;
        }

        //address
        if (shippingAddress === ``) {
            $(`#shippingAddress`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
            $(`#shippingAddress`).siblings(`.invalid-feedback`).text(`Please enter your address`);
            isShippingFormValid = false;
        }
        else if (shippingAddress.match(regAddress)) {
            $(`#shippingAddress`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isShippingFormValid = true;
        }
        else {
            $(`#shippingAddress`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
        }

        //country
        if (shippingCountry === null) {
            $(`#shippingCountry`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
            $(`#shippingCountry`).siblings(`.invalid-feedback`).text(`Please select a country`);
            isShippingFormValid = false;
        }
        else {
            if (shippingCountry === `CAD` && shippingPostalCode.match(canRegPostal)) {
                $(`#shippingCountry`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
                isShippingFormValid = true;
            }
            else {
                $(`#shippingCountry`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
                $(`#shippingCountry`).siblings(`.invalid-feedback`).text(`Country/Postal mismatch`);
                $(`#shippingZip`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
                $(`#shippingZip`).siblings(`.invalid-feedback`).text(`Country/Postal mismatch`);
                isShippingFormValid = false;
            }
        }

        //province/state
        if (shippingProvince === null) {
            if (shippingCountry === `CAD`) {
                $(`#shippingProvince`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
                $(`#shippingProvince`).siblings(`.invalid-feedback`).text(`Please select a province`);
                isShippingFormValid = false;
            }
            else {
                $(`#shippingProvince`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
                $(`#shippingProvince`).siblings(`.invalid-feedback`).text(`Please select a state`);
                isShippingFormValid = false;
            }
        }
        else {
            $(`#billingProvince`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isShippingFormValid = true;
        }

        //city
        if (shippingCity === ``) {
            $(`#shippingCity`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
            $(`#shippingCity`).siblings(`.invalid-feedback`).text(`Please enter your city`);
            isShippingFormValid = false;
        }
        else if (shippingCity.match(regCity)) {
            $(`#shippingCity`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isShippingFormValid = true;
        }
        else {
            $(`#shippingCity`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            isShippingFormValid = false;
        }

        //postal/zip
        if (shippingPostalCode === ``) {
            $(`#shippingZip`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
            $(`#shippingZip`).siblings(`.invalid-feedback`).text(`Please enter your postal code`);
            isShippingFormValid = false;
        }
        else if (shippingPostalCode.match(canRegPostal) || shippingPostalCode.match(usaRegPostal)) {
            $(`#shippingZip`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isShippingFormValid = true;
        }
        else {
            $(`#shippingZip`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            isShippingFormValid = false;
        }

        //phone
        if (shippingPhone === ``) {
            $(`#shippingPhone`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
            $(`#shippingPhone`).siblings(`.invalid-feedback`).text(`Please enter your phone number`);
            isShippingFormValid = false;
        }
        else if (shippingPhone.match(regPhone)) {
            $(`#shippingPhone`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isShippingFormValid = true;
        }
        else {
            $(`#shippingZip`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            isShippingFormValid = false;
        }

        //email
        if (shippingEmail === ``) {
            $(`#shippingEmail`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
            $(`#shippingEmail`).siblings(`.invalid-feedback`).text(`Please enter your email`);
            isShippingFormValid = false;
        }
        else if (shippingEmail.match(regEmail)) {
            $(`#shippingEmail`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isShippingFormValid = true;
        }
        else {
            $(`#shippingEmail`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            isShippingFormValid = false;
        }
    }

    //credit card validation
    function validateCreditCard() {
        billingCcNumber = $(`#creditCardNumber`).val();
        billingCcMonth = $(`#expirationMonth`).val();
        billingCcYear = $(`#expirationYear`).val();
        billingCvc = $(`#cvcNumber`).val();
        if (billingCcNumber === ``) {
            $(`#creditCardNumber`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
            $(`#creditCardNumber`).siblings(`.invalid-feedback`).text(`Please enter your credit card number`);
            isCreditCardFormValid = false;
        }
        else if (billingCcNumber.match(ccRegex)) {
            $(`#creditCardNumber`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isCreditCardFormValid = true;
        }
        else {
            $(`#creditCardNumber`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            $(`#creditCardNumber`).siblings(`.invalid-feedback`).text(`Please enter a valid 16 digit credit card number`);
            isCreditCardFormValid = false;
        }

        if (billingCcMonth === ``) {
            $(`#expirationMonth`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
            $(`#expirationMonth`).siblings(`.invalid-feedback`).text(`Please enter an expiration month`);
            isCreditCardFormValid = false;
        }
        else if (billingCcMonth.match(yearRegex)) {
            $(`#expirationMonth`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isCreditCardFormValid = true;
        }
        else if (billingCcMonth < currentMonth && billingCcYear < currentYear) { 
            $(`#expirationMonth`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            $(`#expirationMonth`).siblings(`.invalid-feedback`).text(`Cannot be in the past!`);
            isCreditCardFormValid = false;
        }


        if (billingCcYear === ``) {
            $(`#expirationYear`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
            $(`#expirationYear`).siblings(`.invalid-feedback`).text(`Please enter an expiration year`);
            isCreditCardFormValid = false;
        }
        else if (billingCcYear.match(monthRegex)) {
            $(`#expirationYear`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isCreditCardFormValid = true;
        }
        else if (billingCcMonth < currentMonth && billingCcYear < currentYear) {
            $(`#expirationYear`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            $(`#expirationYear`).siblings(`.invalid-feedback`).text(`Cannot be in the past!`);
            isCreditCardFormValid = false;
        }

        if (billingCvc === ``) {
            $(`#cvcNumber`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
            $(`#cbcNumber`).siblings(`.invalid-feedback`).text(`Please enter your CVC number`);
            isCreditCardFormValid = false;
        }
        else if (billingCvc.match(cvcRegex)) {
            $(`#cvcNumber`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isCreditCardFormValid = true;
        }
        else {
            $(`#cvcNumber`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            $(`#cvcNumber`).siblings(`.invalid-feedback`).text(`Please enter a valid CVC number`);
            isCreditCardFormValid = false;
        }

    }

    //SECOND VALIDATION METHOD: CHECKING ON FOCUSOUT TO GIVE REAL-TIME FEEDBACK

    //validation for billing/shipping/credit card forms, using these functions to give real-time feedback to the user
    //first name
    $(`#billingFirstName`).on(`focusout`, function() {
        billingFirstName = this.value; //gets the value
        if (billingFirstName.match(regFirstName)) { //checks against regex and displays feedback
            $(this).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isBillingFormValid = true;
        }
        else {
            $(this).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            $(this).siblings(`.invalid-feedback`).text(`Please enter a valid first name (No numbers or spaces)`);
            isBillingFormValid = false;
        }
    });

    //last name
    $(`#billingLastName`).on(`focusout`, function() { //billing last name
        billingLastName = this.value;
        if (billingLastName.match(regLastName)) {
            $(this).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isBillingFormValid = true;
        }
        else {
            $(this).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            $(this).siblings(`.invalid-feedback`).text(`Please enter a valid last name (No numbers or spaces)`);
            isBillingFormValid = false;
        }
    });

    //address
    $(`#billingAddress`).on(`focusout`, function() {
        billingAddress = this.value;
        if (billingAddress.match(regAddress)) {
            $(this).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isBillingFormValid = true;
        }
        else {
            $(this).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            $(this).siblings(`.invalid-feedback`).text(`Please enter a valid address (Ex. 1234 Main St)`);
            isBillingFormValid = false;
        }
    });

    //second address
    $(`#billingSecondAddress`).on(`focusout`, function() {
        billingSecondAddress = this.value;
        if (billingSecondAddress.length === 0) {
            $(this).removeClass(`is-invalid`).siblings(`.invalid-feedback`).hide();
            isBillingFormValid = true;
        }
        else if (billingSecondAddress.match(regSecondAddress)) {
            $(this).removeClass(`is-valid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isBillingFormValid = true;
        }
        else {
            $(this).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            $(this).siblings(`.invalid-feedback`).text(`Please enter a valid address (Ex. Apt 123)`);
            isBillingFormValid = false;
        }
    });

    //city
    $(`#billingCity`).on(`focusout`, function() {
        billingCity = this.value;
        if (billingCity.match(regCity)) {
            $(this).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isBillingFormValid = true;
        }
        else {
            $(this).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
            $(this).siblings(`.invalid-feedback`).text(`Please enter a valid city (No numbers or special characters)`);
            isBillingFormValid = false;
        }
    });

    //phone
    $(`#billingPhone`).on(`focusout`, function() {
        billingPhone = this.value;
        if (billingPhone.match(regPhone)) {
            $(this).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isBillingFormValid = true;
        }
        else {
            $(this).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
            $(this).siblings(`.invalid-feedback`).text(`Please enter a valid phone number (Ex. 123-456-7890 or 123 456 7890)`);
            isBillingFormValid = false;
        }
    });

    //email
    $(`#billingEmail`).on(`focusout`, function() {
        billingEmail = this.value;
        if (billingEmail.match(regEmail)) {
            $(this).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isBillingFormValid = true;
        }
        else {
            $(this).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            $(this).siblings(`.invalid-feedback`).text(`Please enter a valid email address (Ex. name@company.com)`);
            isBillingFormValid = false;
        }
    });

    //country
    $(`#billingCountry`).on(`input`, function() {
        billingCountry = this.value;
        if (billingCountry === 'CAD') {
            $(this).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isBillingFormValid = true;
        }
        else if (billingCountry === 'USA') {
            $(this).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isBillingFormValid = true;
        }
        else {
            $(this).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            isBillingFormValid = false;
        }
    });

    //province
    $(`#billingProvince`).on(`input`, function() {
        billingProvince = this.value;
        if (billingProvince === ``) {
            $(this).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            isBillingFormValid = false;
        }
        else {
            $(this).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isBillingFormValid = true;
        }
    });

    //country
    $('#billingCountry').on('change', function() {
        billingCountry = $(this).val();
        billingPostalCode = $(`#billingZip`).val();
        if (billingCountry === `CAD` && billingPostalCode !== ``) { //to prevent message being displayed before user types a postal code in
            if (billingPostalCode.match(canRegPostal)) {
                $(`#billingZip`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
                isBillingFormValid = true;
            } 
            else {
                $(`#billingZip`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
                $(`#billingZip`).siblings(`.invalid-feedback`).text(`Country/Postal mismatch`);
                isBillingFormValid = false;
            }
        }
        if (billingCountry === 'USA' && billingPostalCode !== ``) {
            if (billingPostalCode.match(usaRegPostal)) {
                $(`#billingZip`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
                isBillingFormValid = true;
            }
            else {
                $(`#billingZip`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
                $(`#billingZip`).siblings(`.invalid-feedback`).text(`Country/Zip mismatch`);
                isBillingFormValid = false;
            }
        }
        if (billingCountry === `CAD`) { //display appropriate options based on country selected
            $(`#billingZip`).attr(`placeholder`, `A1A 1A1`);
            $(`#billingProvince`).empty().append(`
                <option selected disabled>Select Province</option>
                <option value="AB">Alberta</option>
                <option value="BC">British Columbia</option>
                <option value="MB">Manitoba</option>
                <option value="NB">New Brunswick</option>
                <option value="NL">Newfoundland and Labrador</option>
                <option value="NS">Nova Scotia</option>
                <option value="NT">Northwest Territories</option>
                <option value="NU">Nunavut</option>
                <option value="ON">Ontario</option>
                <option value="PE">Prince Edward Island</option>
                <option value="QC">Quebec</option>
                <option value="SK">Saskatchewan</option>
                <option value="YT">Yukon</option>
            `);
        }
        else {
            $(`#billingZip`).attr(`placeholder`, `12345`);
            $(`#billingProvince`).empty().append(`
                <option selected disabled>Select State</option>
                <option value="AK">Alaska</option>
                <option value="AL">Alabama</option>
                <option value="AR">Arkansas</option>
                <option value="AZ">Arizona</option>
                <option value="CA">California</option>
                <option value="CO">Colorado</option>
                <option value="CT">Connecticut</option>
                <option value="DC">District of Columbia</option>
                <option value="DE">Delaware</option>
                <option value="FL">Florida</option>
                <option value="GA">Georgia</option>
                <option value="HI">Hawaii</option>
                <option value="IA">Iowa</option>
                <option value="ID">Idaho</option>
                <option value="IL">Illinois</option>
                <option value="IN">Indiana</option>
                <option value="KS">Kansas</option>
                <option value="KY">Kentucky</option>
                <option value="LA">Louisiana</option>
                <option value="MA">Massachusetts</option>
                <option value="MD">Maryland</option>
                <option value="ME">Maine</option>
                <option value="MI">Michigan</option>
                <option value="MN">Minnesota</option>
                <option value="MO">Missouri</option>
                <option value="MS">Mississippi</option>
                <option value="MT">Montana</option>
                <option value="NC">North Carolina</option>
                <option value="ND">North Dakota</option>
                <option value="NE">Nebraska</option>
                <option value="NH">New Hampshire</option>
                <option value="NJ">New Jersey</option>
                <option value="NM">New Mexico</option>
                <option value="NV">Nevada</option>
                <option value="NY">New York</option>
                <option value="OH">Ohio</option>
                <option value="OK">Oklahoma</option>
                <option value="OR">Oregon</option>
                <option value="PA">Pennsylvania</option>
                <option value="PR">Puerto Rico</option>
                <option value="RI">Rhode Island</option>
                <option value="SC">South Carolina</option>
                <option value="SD">South Dakota</option>
                <option value="TN">Tennessee</option>
                <option value="TX">Texas</option>
                <option value="UT">Utah</option>
                <option value="VA">Virginia</option>
                <option value="VT">Vermont</option>
                <option value="WA">Washington</option>
                <option value="WI">Wisconsin</option>
                <option value="WV">West Virginia</option>
                <option value="WY">Wyoming</option>
            `);
        }
    });

    //postal/zip
    $(`#billingZip`).on(`focusout`, function() {
        billingPostalCode = this.value;
        billingCountry = $(`#billingCountry`).val();
        if (billingCountry === `CAD`) { //checking which country was selected and displaying appropriate feedback
            if (billingPostalCode.match(canRegPostal)) {
                $(this).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
                isBillingFormValid = true;
            } else {
                $(this).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
                $(this).siblings(`.invalid-feedback`).text(`Please enter a valid postal code`);
                isBillingFormValid = false;
            }
            
        } else if (billingCountry === `USA`) {
            if (billingPostalCode.match(usaRegPostal)) {
                $(this).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();  
                isBillingFormValid = true;            
            } else {
                $(this).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
                $(this).siblings(`.invalid-feedback`).text(`Please enter a valid zip code`);
                isBillingForrmValid = false;
            }
        } else if (billingCountry === null) {
            $(this).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            $(this).siblings(`.invalid-feedback`).text(`Please select a country`);
            isBillingFormValid = false;
        } else {
            $(this).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            $(this).siblings(`.invalid-feedback`).text(`Please enter a valid zip code`);
            isBillingFormValid = false;
        }
    });
    
    // SHIPPING (same as billing, nothing different here except variable names)
    //first name
    $(`#shippingFirstName`).on(`focusout`, function() { 
        shippingFirstName = this.value;
        if (shippingFirstName.match(regFirstName)) {
            $(this).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isShippingFormValid = true;
        }
        else {
            $(this).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
            $(this).siblings(`.invalid-feedback`).text(`Please enter a valid first name (No numbers or spaces)`);
            isShippingFormValid = false;
        }
    });

    //last name
    $(`#shippingLastName`).on(`focusout`, function() { //billing last name
        shippingLastName = this.value;
        if (shippingLastName.match(regLastName)) {
            $(this).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isShippingFormValid = true;
        }
        else {
            $(this).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
            $(this).siblings(`.invalid-feedback`).text(`Please enter a valid last name (No numbers or spaces)`);
            isShippingFormValid = false;
        }
    });

    //address
    $(`#shippingAddress`).on(`focusout`, function() {
        shippingAddress = this.value;
        if (shippingAddress.match(regAddress)) {
            $(this).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isShippingFormValid = true;
        }
        else {
            $(this).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
            $(this).siblings(`.invalid-feedback`).text(`Please enter a address (Ex. 1234 Main St)`);
            isShippingFormValid = false;
        }
    });

    //second address
    $(`#shippingSecondAddress`).on(`focusout`, function() {
        shippingSecondAddress = this.value;
        if (shippingSecondAddress.length === 0) {
            $(this).removeClass(`is-invalid`).siblings(`.invalid-feedback`).hide();
            isShippingFormValid = true;
        }
        else if (shippingSecondAddress.match(regSecondAddress)) {
            $(this).removeClass(`is-valid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isShippingFormValid = true;
        }
        else {
            $(this).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
            $(this).siblings(`.invalid-feedback`).text(`Please enter a valid second address(Ex. Apt 123)`);
            isShippingFormValid = false;
        }
    });

    //city
    $(`#shippingCity`).on(`focusout`, function() {
        shippingCity = this.value;
        if (shippingCity.match(regCity)) {
            $(this).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isShippingFormValid = true;
        }
        else {
            $(this).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
            $(this).siblings(`.invalid-feedback`).text(`Please enter a valid city (Ex. Los Angeles)`);
            isShippingFormValid = false;
        }
    });

    //phone
    $(`#shippingPhone`).on(`focusout`, function() {
        shippingPhone = this.value;
        if (shippingPhone.match(regPhone)) {
            $(this).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isShippingFormValid = true;
        }
        else {
            $(this).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
            $(this).siblings(`.invalid-feedback`).text(``);
            isShippingFormValid = false;
        }
    });

    //email
    $(`#shippingEmail`).on(`focusout`, function() {
        shippingEmail = this.value;
        if (shippingEmail.match(regEmail)) {
            $(this).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isShippingFormValid = true;
        }
        else {
            $(this).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
            $(this).siblings(`.invalid-feedback`).text(`Please enter a valid email address (Ex. someone@company.com)`);
            isShippingFormValid = false;
        }
    });

    //country
    $('#shippingCountry').on('change', function() {
        shippingCountry = $(this).val();
        shippingPostalCode = $(`#shippingZip`).val();
        if (shippingCountry === `CAD` && shippingPostalCode !== ``) { //to prevent message being displayed before user types a postal code in
            if (shippingPostalCode.match(canRegPostal)) {
                $(`#shippingZip`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
                isShippingFormValid = true;
            } 
            else {
                $(`#shippingZip`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
                $(`#shippingZip`).siblings(`.invalid-feedback`).text(`Country/Postal mismatch`);
                isShippingFormValid = false;
            }
        }
        if (shippingCountry === 'USA' && shippingPostalCode !== ``) {
            if (shippingPostalCode.match(usaRegPostal)) {
                $(`#shippingZip`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
                isShippingFormValid = true;
            }
            else {
                $(`#shippingZip`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
                $(`#shippingZip`).siblings(`.invalid-feedback`).text(`Country/Zip mismatch`);
                isShippingFormValid = false;
            }
        }
        if (shippingCountry === `CAD`) { //display appropriate options based on country selected
            $(`#shippingZip`).attr(`placeholder`, `A1A 1A1`);
            $(`#shippingProvince`).empty().append(`
                <option selected disabled>Select Province</option>
                <option value="AB">Alberta</option>
                <option value="BC">British Columbia</option>
                <option value="MB">Manitoba</option>
                <option value="NB">New Brunswick</option>
                <option value="NL">Newfoundland and Labrador</option>
                <option value="NS">Nova Scotia</option>
                <option value="NT">Northwest Territories</option>
                <option value="NU">Nunavut</option>
                <option value="ON">Ontario</option>
                <option value="PE">Prince Edward Island</option>
                <option value="QC">Quebec</option>
                <option value="SK">Saskatchewan</option>
                <option value="YT">Yukon</option>
            `);
        }
        else {
            $(`#shippingZip`).attr(`placeholder`, `12345`);
            $(`#shippingProvince`).empty().append(`
                <option selected disabled>Select State</option>
                <option value="AK">Alaska</option>
                <option value="AL">Alabama</option>
                <option value="AR">Arkansas</option>
                <option value="AZ">Arizona</option>
                <option value="CA">California</option>
                <option value="CO">Colorado</option>
                <option value="CT">Connecticut</option>
                <option value="DC">District of Columbia</option>
                <option value="DE">Delaware</option>
                <option value="FL">Florida</option>
                <option value="GA">Georgia</option>
                <option value="HI">Hawaii</option>
                <option value="IA">Iowa</option>
                <option value="ID">Idaho</option>
                <option value="IL">Illinois</option>
                <option value="IN">Indiana</option>
                <option value="KS">Kansas</option>
                <option value="KY">Kentucky</option>
                <option value="LA">Louisiana</option>
                <option value="MA">Massachusetts</option>
                <option value="MD">Maryland</option>
                <option value="ME">Maine</option>
                <option value="MI">Michigan</option>
                <option value="MN">Minnesota</option>
                <option value="MO">Missouri</option>
                <option value="MS">Mississippi</option>
                <option value="MT">Montana</option>
                <option value="NC">North Carolina</option>
                <option value="ND">North Dakota</option>
                <option value="NE">Nebraska</option>
                <option value="NH">New Hampshire</option>
                <option value="NJ">New Jersey</option>
                <option value="NM">New Mexico</option>
                <option value="NV">Nevada</option>
                <option value="NY">New York</option>
                <option value="OH">Ohio</option>
                <option value="OK">Oklahoma</option>
                <option value="OR">Oregon</option>
                <option value="PA">Pennsylvania</option>
                <option value="PR">Puerto Rico</option>
                <option value="RI">Rhode Island</option>
                <option value="SC">South Carolina</option>
                <option value="SD">South Dakota</option>
                <option value="TN">Tennessee</option>
                <option value="TX">Texas</option>
                <option value="UT">Utah</option>
                <option value="VA">Virginia</option>
                <option value="VT">Vermont</option>
                <option value="WA">Washington</option>
                <option value="WI">Wisconsin</option>
                <option value="WV">West Virginia</option>
                <option value="WY">Wyoming</option>
            `);
        }
    });

    //postal/zip
    $(`#shippingZip`).on(`focusout`, function() {
        shippingPostalCode = this.value;
        shippingCountry = $(`#shippingCountry`).val();
        if (shippingCountry === `CAD`) { //checking which country was selected and displaying appropriate feedback
            if (shippingPostalCode.match(canRegPostal)) {
                $(this).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide()
                $(this).siblings(`.invalid-feedback`).text(`Please enter a valid postal code`);
                isShippingFormValid = false;
            } else {
                $(this).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
                $(this).siblings(`.invalid-feedback`).text(`Please enter a valid postal code`);
                isShippingFormValid = false;
            }
        } else if (shippingCountry === `USA`) {
            if (shippingPostalCode.match(usaRegPostal)) {
                $(this).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide()
                $(this).siblings(`.invalid-feedback`).text(`Please enter a valid zip code`);   
                isShippingFormValid = false;            
            } else {
                $(this).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
                $(this).siblings(`.invalid-feedback`).text(`Please enter a valid zip code`);
                isShippingFormValid = false;
            }
        } else if (shippingCountry === null) {
            $(this).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
            $(this).siblings(`.invalid-feedback`).text(`Please select a country`);
            isShippingFormValid = false;
        } else {
            $(this).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            $(this).siblings(`.invalid-feedback`).text(`Please enter a valid zip code`);
            isShippingFormValid = false;
        }
    });

    //credit card form
    $(`#creditCardNumber`).on(`focusout`, function() {
        billingCcNumber = this.value;
        if (billingCcNumber.match(ccRegex)) {
            $(this).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isCreditCardFormValid = true;
        }
        else {
            $(this).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            $(this).siblings(`.invalid-feedback`).text(`Please enter a valid 16 digit credit card number`);
            isCreditCardFormValid = false;
        }
    });

    $(`#expirationMonth`).on(`focusout`, function() {
        billingCcYear = parseInt($(`#expirationYear`).val());
        if (billingCcYear < currentYear) {
            $(this).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
            $(this).siblings(`.invalid-feedback`).text(`Cannot be in the past!`);
            isCreditCardFormValid = false;
        }
        if ($(`#expirationYear`).val().match(yearRegex) && (billingCcYear > currentYear || (billingCcYear === currentYear && this.value >= currentMonth))) { //checking the date
            if (this.value.match(monthRegex) && this.value !== ``) {
                $(this).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
                $(`#expirationYear`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
                isCreditCardFormValid = true;
            } 
            else {
                $(this).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show()
                $(this).siblings(`.invalid-feedback`).text(`Cannot be in the past!`);
                isCreditCardFormValid = false;
            }
        } 
        else {
            $(this).removeClass(`is-valid`).removeClass(`is-invalid`).siblings(`.invalid-feedback`).hide();
            isCreditCardFormValid = true;
        }
    });
      
    $(`#expirationYear`).on(`focusout`, function() {
        billingCcMonth = $(`#expirationMonth`).val();
        if (((billingCcMonth.match(monthRegex)) && this.value.match(yearRegex)) && ((this.value >= currentYear && billingCcMonth >= currentMonth) || (this.value === currentYear && billingCcMonth === currentMonth +1))) {
            if (billingCcMonth) {
                $(this).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
                $(`#expirationMonth`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
                isCreditCardFormValid = true;
            }
            $(this).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            $(`#expirationMonth`).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isCreditCardFormValid = true;
        } 
        else {
            $(this).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            $(`#expirationMonth`).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            $(`#expirationMonth`).siblings(`.invalid-feedback`).text("Cannot be in the past!");
            $(this).siblings(`.invalid-feedback`).text("Cannot be in the past!");
            isCreditCardFormValid = false;
        }
    });

    $(`#cvcNumber`).on(`focusout`, function() {
        billingCvc = this.value;
        if (billingCvc.match(cvcRegex)) {
            $(this).removeClass(`is-invalid`).addClass(`is-valid`).siblings(`.invalid-feedback`).hide();
            isCreditCardFormValid = true;
        }
        else {
            $(this).removeClass(`is-valid`).addClass(`is-invalid`).siblings(`.invalid-feedback`).show();
            isCreditCardFormValid = false;
        }
    });

    //logic for hiding and showing buttons
    $(`#pills-payment-tab`).click(function() {
        $(`#submitOrderBtn`).hide();
        $(`#continueBtn`).show();
        $(`#backBtn`).show();
    });

    $(`#pills-shipping-tab`).click(function() {
        $(`#submitOrderBtn`).hide();
        $(`#continueBtn`).show();
        $(`#backBtn`).show();
    });

    $(`#pills-billing-tab`).click(function() {
        $(`#submitOrderBtn`).hide();
        $(`#continueBtn`).show();
        $(`#backBtn`).hide();
    });

    $(`#pills-confirmation-tab`).click(function() {
        $(`#submitOrderBtn`).show();
        $(`#continueBtn`).hide();
        $(`#backBtn`).show();
    });
});
//the end.