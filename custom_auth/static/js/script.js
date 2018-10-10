$(function () {

    var toggler = document.getElementsByClassName("caret");
    var i;

    for (i = 0; i < toggler.length; i++) {
      toggler[i].addEventListener("click", function() {
        this.parentElement.querySelector(".nested").classList.toggle("active");
        this.classList.toggle("caret-down");
      });
    }


	// Globals variables

		// 	An array containing objects with information about the products.
	var products = [],

		// Our filters object will contain an array of values for each filter

		// Example:
		// filters = {
		// 		"manufacturer" = ["Apple","Sony"],
		//		"storage" = [16]
		//	}
		filters = {},
		tokenKey = 'UserToken',
		userToken = null,
        userInfo = [],
        myCards = [];

     initLogin();


	//	Event handlers for frontend navigation

	//	Loading ny cards
	$('#mycards').click(function () {
        getMyCards();
	});


	function getMyCards() {
        $.ajax({
            type: "GET",
            url: "/manage/card/?me",
            beforeSend: function(xhr, settings) {
                xhr.setRequestHeader("Authorization", localStorage.getItem('UserToken'));
            },
            contentType: "application/json",
            cache: false,
            success: function(data){
                myCards = data;
                console.log(data);
                renderMyCards(data);
            },
            error: function(xhr){
                console.log(xhr);
            }
        });
    }


    function renderMyCards(data) {
        var card;

        $('#tableMyCards > tbody > tr').remove();

        for(card = 0; card < data.length; card++) {
            row = '<tr>'+
                  '<th scope="row"><a href="/#card/' + data[card].id + '">' + data[card].id  + '</a></th>' +
                  '<td>' + data[card].status_repr.name + '</td>' +
                  '<td>' + data[card].title + '</td>' +
                  '<td>' + cardDate(data[card], 'created') + '</td>' +
                  '<td>' + userName(data[card].assigned_to_repr) + '</td>' +
                  '</tr>';

            $('#tableMyCards > tbody:last-child').append(row);
        }

    }



    function getAssignedTo() {
        $.ajax({
            type: "OPTIONS",
            url: "/manage/card/",
            beforeSend: function(xhr, settings) {
                xhr.setRequestHeader("Authorization", localStorage.getItem('UserToken'));
            },
            contentType: "application/json",
            cache: false,
            success: function(data){
                assignedTo = data;
                console.log(data);
                renderAssignedTo(data);
            },
            error: function(xhr){
                console.log(xhr);
            }
        });
    }

    function renderAssignedTo(data) {
        var item;
        var listAssignedTo = data.actions.POST.assigned_to.choices;

        $('#assignedToList > option').remove();

        for(item = 0; item < listAssignedTo.length; item++) {
            row = '<option value="' + listAssignedTo[item].display_name + '" data-value="' + listAssignedTo[item].value + '">';

            $('#assignedToList').append(row);
        }

    }


    // Login
	$('#btnSignIn').click(function () {

        $.ajax({
            type: "POST",
            url: "/signin/",
            data: JSON.stringify({
                "email": $('#signInEmail').val(),
                "password": $('#signInPassword').val()
            }),
            contentType: "application/json",
            cache: false,
            success: function(data){
//                localStorage.setItem(tokenKey, data);
                localStorage.setItem('UserToken', data);
                console.log(data);
//                getProfile();
                initLogin();

                window.location.hash = '#';
            },
            error: function(xhr){
                $('#signInErr').html(xhr.responseText);
            }
        });

	});

    // Registration
	$('#btnRegister').click(function () {

        $.ajax({
            type: "POST",
            url: "/signup/",
            data: JSON.stringify({
                "email": $('#signUpEmail').val(),
                "username": $('#signUpUserName').val(),
                "first_name": $('#signUpFirstName').val(),
                "last_name": $('#signUpLastName').val(),
                "phone_number": $('#signUpPhonenumber').val(),
                "password":  $('#signUpPassword').val(),
                "password_confirm": $('#signUpPasswordConfirm').val()
            }),
            contentType: "application/json",
            cache: false,
            success: function(data){
                console.log(data);
                window.location.hash = '#sign';
            },
            error: function(xhr){
                $('#signUpErr').html(xhr.responseText);
            }
        });

	});

    // Redirect to Registration
	$('#btnToSignUp').click(function () {
	    window.location.hash = '#sign-up';
	});

    // Logout
	$('#btnLogout').click(function () {
	    try{
	        localStorage.clear();
	        initLogin();
	    }
	    catch(error) {
	        console.log(error);
	    }
	});

    // New Card
	$('#btnNewCard').click(function () {
        window.location.hash = '#card/new';
	});

    // Save Card
//	$('#btnSaveNewCard').click();

	function saveNewCard() {
        var title = $('#inputCardTitle').val(),
            assignedTo = null,
            dueDate = '2000-01-01 00:00:00+01',
            description = $('#cardDescription').val();


        $.ajax({
            type: "POST",
            url: "/manage/card/",
            beforeSend: function(xhr, settings) {
                xhr.setRequestHeader("Authorization", localStorage.getItem('UserToken'));
            },
            data: JSON.stringify({
                "title": title,
                "description": description,
                "assigned_to": assignedTo,
                "due_date": dueDate
            }),
            contentType: "application/json",
            cache: false,
            async: false,
            success: function(data){
                console.log(data);
                window.location.hash = '#';
            },
            error: function(xhr){
                $('#cardErr').html(xhr.responseText);
            }
        });

	}

	function saveChangesCard() {
	    alert('Save changes in current card...');
	}


	var checkboxes = $('.all-products input[type=checkbox]');

	checkboxes.click(function () {

		var that = $(this),
			specName = that.attr('name');

		// When a checkbox is checked we need to write that in the filters object;
		if(that.is(":checked")) {

			// If the filter for this specification isn't created yet - do it.
			if(!(filters[specName] && filters[specName].length)){
				filters[specName] = [];
			}

			//	Push values into the chosen filter array
			filters[specName].push(that.val());

			// Change the url hash;
			createQueryHash(filters);

		}

		// When a checkbox is unchecked we need to remove its value from the filters object.
		if(!that.is(":checked")) {

			if(filters[specName] && filters[specName].length && (filters[specName].indexOf(that.val()) != -1)){

				// Find the checkbox value in the corresponding array inside the filters object.
				var index = filters[specName].indexOf(that.val());

				// Remove it.
				filters[specName].splice(index, 1);

				// If it was the last remaining value for this specification,
				// delete the whole array.
				if(!filters[specName].length){
					delete filters[specName];
				}

			}

			// Change the url hash;
			createQueryHash(filters);
		}
	});


    // SignIn page buttons
	var signInPage = $('.sign-in');

	signInPage.on('click', function (e) {

	    if (signInPage.hasClass('visible')) {

			var clicked = $(e.target);

			// If the close button or the background are clicked go to the previous page.
			if (clicked.hasClass('close') || clicked.hasClass('overlay')) {
				// Change the url hash with the last used filters.
				createQueryHash(filters);

			}

		}

	});


	// SignIn page buttons
	var signUpPage = $('.sign-up');

	signUpPage.on('click', function (e) {

	    if (signUpPage.hasClass('visible')) {

			var clicked = $(e.target);

			// If the close button or the background are clicked go to the previous page.
			if (clicked.hasClass('close') || clicked.hasClass('overlay')) {
				// Change the url hash with the last used filters.
				createQueryHash(filters);

			}

		}

	});


	// Single card page buttons

	var singleCardPage = $('.single-card');

	singleCardPage.on('click', function (e) {

		if (singleCardPage.hasClass('visible')) {

			var clicked = $(e.target);

			// If the close button or the background are clicked go to the previous page.
			if (clicked.hasClass('close') || clicked.hasClass('overlay') || clicked.hasClass('btn-close')) {
				// Change the url hash with the last used filters.
				createQueryHash(filters);
			}

		}

	});


	// These are called on page load

	// Get data about our products from products.json.
//	$.getJSON( "products.json", function( data ) {
//
//		// Write the data into our global variable.
//		products = data;
//
//		// Call a function to create HTML for all the products.
//		generateAllProductsHTML(products);
//
//		// Manually trigger a hashchange to start the app.
//		$(window).trigger('hashchange');
//	});


	// An event handler with calls the render function on every hashchange.
	// The render function will show the appropriate content of out page.
	$(window).on('hashchange', function(){
		render(decodeURI(window.location.hash));
	});


	function getProfile() {

	    $.ajax({
            type: "GET",
            url: "/profile/",
            beforeSend: function(xhr, settings) {
                xhr.setRequestHeader("Authorization", localStorage.getItem('UserToken'));
            },
            contentType: "application/json",
            cache: false,
            async: false,
            success: function(data){
                userInfo = JSON.stringify(data);
                localStorage.setItem("User", JSON.stringify(data));
            },
            error: function(xhr){
                console.log(xhr);
            }
        });

        console.log("User info : " + userInfo );
	}


	function setUserInfo() {
        try {
            t = JSON.parse(localStorage.getItem("User"));
            $('#username').html(t["username"]);
        } catch(error) {
            console.log(error);
            $('#username').html('User');
        }
	}


	function initLogin() {
	    try{
    	    userToken = localStorage.getItem('UserToken');
	    }catch(error){
	        userToken = null;
	        console.log(error);
	    }

	    getProfile();

	    if(userToken) {
            setUserInfo();

            $('.non-logged-in').hide();
            $('.logged-in').show();
	    } else {
            $('.non-logged-in').show();
            $('.logged-in').hide();
	    }
	}


    function userName(obj) {
        var user_name = '';

        if (obj) {
            user_name = obj.first_name + ' ' + obj.last_name;
        }

        return user_name;
    }

    function assignedUser(username) {

        if (!username) {
            username = 'None';
        }

        return username;
    }

    function cardDate(obj, type) {
        var date = "0000-00-00",
            time = "00:00:00";

        if (type == 'created') {
            date = obj.created_date.split('T')[0];
            time = obj.created_date.split('T')[1].substring(0,8);
        } else if(type == 'due') {
            date = obj.due_date.split('T')[0];
            time = obj.due_date.split('T')[1].substring(0,8);
        } else {
            console.log("Wrong type date !!!")
        }

        return date + ' ' + time;
    }


	// Navigation

	function render(url) {

		// Get the keyword from the url.
		var temp = url.split('/')[0];

		// Hide whatever page is currently shown.
		$('.main-content .page').removeClass('visible');


		var	map = {

			// The "Homepage".
			'': function() {

				// Clear the filters object, uncheck all checkboxes, show all the products
				filters = {};
				checkboxes.prop('checked',false);

				renderProductsPage(products);
			},

			//Page with cards created by curent user
			'#card': function() {

				var index = url.split('#card/')[1].trim();

				renderSingleCardPage(index, myCards);

			},

			// Single Products page.
			'#product': function() {

				// Get the index of which product we want to show and call the appropriate function.
				var index = url.split('#product/')[1].trim();

				renderSingleProductPage(index, products);
			},

			// Page with filtered products
			'#filter': function() {

				// Grab the string after the '#filter/' keyword. Call the filtering function.
				url = url.split('#filter/')[1].trim();

				// Try and parse the filters object from the query string.
				try {
					filters = JSON.parse(url);
				}
					// If it isn't a valid json, go back to homepage ( the rest of the code won't be executed ).
				catch(err) {
					window.location.hash = '#';
					return;
				}

				renderFilterResults(filters, products);
			},

			//Page for Sign In
			'#sign-in': function() {
                renderSignInPage();
			},

			//Page for Sign Up
			'#sign-up': function() {
                renderSignUpPage();
			}

		};

		// Execute the needed function depending on the url keyword (stored in temp).
		if(map[temp]){
			map[temp]();
		}
		// If the keyword isn't listed in the above - render the error page.
		else {
			renderErrorPage();
		}

	}


	// This function is called only once - on page load.
	// It fills up the products list via a handlebars template.
	// It recieves one parameter - the data we took from products.json.
	function generateAllProductsHTML(data){

		var list = $('.all-products .products-list');

		var theTemplateScript = $("#products-template").html();
		//Compile the template​
		var theTemplate = Handlebars.compile (theTemplateScript);
		list.append (theTemplate(data));


		// Each products has a data-index attribute.
		// On click change the url hash to open up a preview for this product only.
		// Remember: every hashchange triggers the render function.
		list.find('li').on('click', function (e) {
			e.preventDefault();

			var productIndex = $(this).data('index');

			window.location.hash = 'product/' + productIndex;
		})
	}

	// This function receives an object containing all the product we want to show.
	function renderProductsPage(data){

		var page = $('.all-products'),
			allProducts = $('.all-products .products-list > li');

		// Hide all the products in the products list.
		allProducts.addClass('hidden');

		// Iterate over all of the products.
		// If their ID is somewhere in the data object remove the hidden class to reveal them.
		allProducts.each(function () {

			var that = $(this);

			data.forEach(function (item) {
				if(that.data('index') == item.id){
					that.removeClass('hidden');
				}
			});
		});

		// Show the page itself.
		// (the render function hides all pages so we need to show the one we want).
		page.addClass('visible');

	}


	// Opens up a preview for one of the products.
	// Its parameters are an index from the hash and the products object.
	function renderSingleProductPage(index, data){

		var page = $('.single-product'),
			container = $('.preview-large');

		// Find the wanted product by iterating the data object and searching for the chosen index.
		if(data.length){
			data.forEach(function (item) {
				if(item.id == index){
					// Populate '.preview-large' with the chosen product's data.
					container.find('h3').text(item.name);
					container.find('img').attr('src', item.image.large);
					container.find('p').text(item.description);
				}
			});
		}

		// Show the page.
		page.addClass('visible');

	}


	function renderSingleCardPage(index, data){

        var page = $('.single-card'),
            container = $('.preview-large');

        getAssignedTo();

        $('#btnSaveNewCard').unbind('click');

        if (index == 'new') {
            $('#cardTitle').hide()
            $('#inputTitle').show()

//            $('#cardTitle').html('New card');
            $('#cardOwner').val(userName(JSON.parse(localStorage.getItem('User'))));

            //Set hendler for Save button

            $('#btnSaveNewCard').on('click', saveNewCard);


        } else {

            if(myCards.length){
                myCards.forEach(function (item) {
                    if(item.id == index){
                        $('#cardTitle').html('#' + item.id + ' ' + item.title);
                        $('#cardOwner').val(userName(item.owner_repr));
                        $('#cardStatus').val(item.status_repr.name);
                        $('#cardCreatedDate').val(cardDate(item,'created'));
//                        $('#cardAssignedTo').val(assignedUser(userName(item.assigned_to_repr)));
                        $('#cardDescription').val(item.description);

                        $('#btnSaveNewCard').on('click', saveChangesCard);
                        $('#cardTitle').show();
                        $('#inputTitle').hide();
                    }
                });
            }


        }

        // Show the page.
        page.addClass('visible');

	}


    //Opens up a Sign-in view
    function renderSignInPage(){

		var page = $('.sign-in');

		page.addClass('visible');
	}


    //Opens up a Sign-in view
    function renderSignUpPage(){

		var page = $('.sign-up');

		page.addClass('visible');
	}


	// Find and render the filtered data results. Arguments are:
	// filters - our global variable - the object with arrays about what we are searching for.
	// products - an object with the full products list (from product.json).
	function renderFilterResults(filters, products){

			// This array contains all the possible filter criteria.
		var criteria = ['manufacturer','storage','os','camera'],
			results = [],
			isFiltered = false;

		// Uncheck all the checkboxes.
		// We will be checking them again one by one.
		checkboxes.prop('checked', false);


		criteria.forEach(function (c) {

			// Check if each of the possible filter criteria is actually in the filters object.
			if(filters[c] && filters[c].length){


				// After we've filtered the products once, we want to keep filtering them.
				// That's why we make the object we search in (products) to equal the one with the results.
				// Then the results array is cleared, so it can be filled with the newly filtered data.
				if(isFiltered){
					products = results;
					results = [];
				}


				// In these nested 'for loops' we will iterate over the filters and the products
				// and check if they contain the same values (the ones we are filtering by).

				// Iterate over the entries inside filters.criteria (remember each criteria contains an array).
				filters[c].forEach(function (filter) {

					// Iterate over the products.
					products.forEach(function (item){

						// If the product has the same specification value as the one in the filter
						// push it inside the results array and mark the isFiltered flag true.

						if(typeof item.specs[c] == 'number'){
							if(item.specs[c] == filter){
								results.push(item);
								isFiltered = true;
							}
						}

						if(typeof item.specs[c] == 'string'){
							if(item.specs[c].toLowerCase().indexOf(filter) != -1){
								results.push(item);
								isFiltered = true;
							}
						}

					});

					// Here we can make the checkboxes representing the filters true,
					// keeping the app up to date.
					if(c && filter){
						$('input[name='+c+'][value='+filter+']').prop('checked',true);
					}
				});
			}

		});

		// Call the renderProductsPage.
		// As it's argument give the object with filtered products.
		renderProductsPage(results);
	}


	// Shows the error page.
	function renderErrorPage(){
		var page = $('.error');
		page.addClass('visible');
	}


	// Get the filters object, turn it into a string and write it into the hash.
	function createQueryHash(filters){

		// Here we check if filters isn't empty.
		if(!$.isEmptyObject(filters)){
			// Stringify the object via JSON.stringify and write it after the '#filter' keyword.
			window.location.hash = '#filter/' + JSON.stringify(filters);
		}
		else{
			// If it's empty change the hash to '#' (the homepage).
			window.location.hash = '#';
		}

	}


	// SRFToken !!!
	function csrfSafeMethod(method) {
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }

    $.ajaxSetup({
        beforeSend: function(xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", $('input[name="csrfmiddlewaretoken"]').val());
            }
        }
    });

});