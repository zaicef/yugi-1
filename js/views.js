//******************************************************************************
//                                 Views
//******************************************************************************

/* global Backbone, jQuery, _, ENTER_KEY, ESC_KEY, myapp, tempdetail */
var app = app || {};
//******************************************************************************
//                The Application  (The top-level piece of UI)
//******************************************************************************

app.AppView = Backbone.View.extend({
// Instead of generating a new element, bind to the existing skeleton of
// the App already present in the HTML.
    el: 'body',
    // Our template for the line of statistics at the bottom of the app.
    // Delegated events for creating new items, and clearing completed ones.
    events: {
        'keypress .cardname': 'searchWithName'
    },
    // At initialization we bind to the relevant events on the `Todos`
    // collection, when items are added or changed. Kick things off by
    // loading any preexisting todos that might be saved in *localStorage*.
    initialize: function () {
        this.instances = {};
        this.instances.mycollection = new app.CardC(); // 

        // this.allCheckbox = this.$('.toggle-all')[0];
        this.$input = this.$('.cardname');
    },
    // Re-rendering the App just means refreshing the statistics -- the rest
    // of the app doesn't change.
    render: function () {

    },
    // Add a single todo item to the list by creating a view for it, and
    // appending its element to the `<ul>`.
    addOne: function (todo) {
        var view = new app.TodoView({model: todo});
        this.$list.append(view.render().el);
    },
    // Add all items in the **Todos** collection at once.
    addAll: function () {
        this.$list.html('');
        app.todos.each(this.addOne, this);
    },
    filterOne: function (todo) {
        todo.trigger('visible');
    },
    filterAll: function () {
        app.todos.each(this.filterOne, this);
    },
    searchWithName: function (e) {
        var thisview = this;
        if (e.which === ENTER_KEY && this.$input.val().trim()) {
            $('.cardname').attr('disabled', true);
            var request = new XMLHttpRequest();
            request.open('GET', apiurl + '/card_data/' + this.$input.val().trim());
            request.onreadystatechange = function () {
                if (this.readyState === 4) {
                    $('.cardname').attr('disabled', false);
                    console.log('Status:', this.status);
                    console.log('Headers:', this.getAllResponseHeaders());
                    console.log('Body:', this.responseText);
                    var atts = JSON.parse(this.responseText);
                    if (thisview.instances.popover !== undefined) {
                        thisview.instances.popover.destroy();
                        thisview.instances.popover = undefined;
                    }

                    // console.log(atts);
                    if (atts.status === 'fail') {
                        thisview.instances.popover = new app.PopOverViewEmtyView({model: mymodel});
                    } else if (atts.status === 'success') {
                        var mymodel = new app.CardM(atts);
                        thisview.instances.popover = new app.PopOverView({model: mymodel});
                    }

                }
            }
            ;
            request.send();
            e.preventDefault();
        } else {
            if (thisview.instances.popover !== undefined) {
                thisview.instances.popover.destroy();
            }
        }
    },
    dialogAlert: function (title, text, icon) {
        if (icon === undefined) {
            icon = 'glyphicon-info-sign';
        }
        var alTemplate = _.template(''
                + '<div class="modal fade  " tabindex="-1" id="myModal" role="dialog">'
                + '<div class="modal-dialog modal-sm" role="document">'
                + '<div class="modal-content">'
                + '<div class="modal-header">'
                + '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>'
                + '<h4 class="modal-title"> <span class="glyphicon <%print(icon)%>" aria-hidden="true"></span>  <%print(title)%></h4>'
                + '</div>'
                + '<div class="modal-body">'
                + '<p><%print(text)%></p>'
                + '</div>'
                + '<div class="modal-footer">'
                + '<button type="button" class="btn btn-primary" data-dismiss="modal">ok</button>'
                //     + '    <button type="button" class="btn btn-primary">Save changes</button>'
                + '</div>'
                + '</div><!-- /.modal-content -->'
                + ' </div><!-- /.modal-dialog -->'
                + '</div><!-- /.modal -->'
                + '');
        var htmltoshow = alTemplate({title: title, text: text, icon: icon});
        $('#mymodalSpace').html(htmltoshow);
        $('#myModal').modal('show');
    },
    //some global functions..
    jump: function (h) {
        var top = document.getElementById(h).offsetTop;
        window.scrollTo(0, top - 150);
        //location.href = h;
        //window.scrollTo(0, -50);
    }


});
//******************************************************************************
//                               PopOverView
//******************************************************************************

app.PopOverView = Backbone.View.extend({
    el: '.cardname',
    initialize: function () {
        this.render();
    },
    template: _.template('\
            <div class="panel panel-default"> <img \n\
            src = "<%print(image) %> "  alt = "thumbnail" class = "img-thumbnail"></div></div>'
            + '<div class="panel panel-default">'
            + '<div class="panel-heading">Name:</div><div class="panel-body"><% print(data.name) %></div>'
            + '<div class="panel-heading">Type:</div><div class="panel-body"><% print(data.type) %></div>'
            + '<div class="panel-heading">Text:</div><div class="panel-body"><% print(data.text) %></div>'
            + '</div><div class="modal-footer">'
            + '<button type="button" class="btn btn-success addcard" data-dismiss="modal">Add to Deck</button>'
            + '<button type="button" class="btn btn-danger closepop" data-dismiss="modal">Close</button>'
            + '</div>'
            )
    ,
    render: function () {
        var pop = this;
        $(this.el).popover({
            placement: "bottom",
            title: this.model.get("data").name,
            content: this.template(this.model.toJSON()),
            html: true
        });
        //console.log(this.model.toJSON());
        $('.cardname').popover('show');
		
		var aaa = $(window).height() - 100
		$('.popover-content').css('max-height', aaa +'px');
		
		
        $('.addcard').click(function () {
            console.log(pop.model);
            myapp.instances.mycollection.checkBeforeAdd(pop.model);
            pop.destroy();
        });
        $('.closepop').click(function () {
            pop.destroy();
        });
    },
    destroy: function () {
        $(this.el).popover('destroy');
    }
});
//******************************************************************************
//                                ColItemView
//******************************************************************************

app.ColItemView = Backbone.View.extend({
    model: app.CardM,
    initialize: function () {
        this.el = '#' + this.model.get("id");
        this.render();
    },
    events: {
        //   'click': 'displayDetails'
    },
    template: _.template(''
            + '<li class="yugiitem list-group-item" id="<%print(id) %>">'
            + '<div class="dl-horizontal">'
            + '<div class="pull-left" ><img src = "<%print(image) %> "  alt = "thumbnail" class = "img-rounded"></div>'
            + '<div class="desc" ><b>Name: <%print(data.name)%></b><br><p class="text-muted">Type :<%print(data.type)%></div></prototype>'
            + '</div>'
            + '</li>'
            )
    ,
    render: function () {
        $('.yugiitemempty').hide();
        var view = this;
        var html = this.template(this.model.toJSON());
        $('#mycollection').append(html);
        $(this.el).click(function () {

            view.displayDetails();
        });
    },
    destroy: function () {
        $(this.el).remove();
    },
    displayDetails: function () {

        if (tempdetail !== undefined) {

            tempdetail.undelegateEvents();
        }
        tempdetail = new app.CardDetailsView({model: this.model});
        myapp.jump('det');

    }

});
//******************************************************************************
//                            PopOverViewEmtyView
//******************************************************************************

app.PopOverViewEmtyView = Backbone.View.extend({
    el: '.cardname',
    initialize: function () {
        this.render();
    },
    render: function () {
        var pop = this;
        $(this.el).popover({
            placement: "bottom",
            title: '<h4>Emty List</h4>',
            content: '<img \n\
                     src = "img/yuug1.png"  alt = "thumbnail" class = "img-thumbnail"></div></div><hr>'
                    + '<div class="panel panel-danger"><div class="panel-heading">'
                    + '<h3 class="panel-title">Note</h3>'
                    + '</div>'
                    + '<div class="panel-body">No cards matching this name were found in our database.'
                    + '<br><br>Please try again.</div>'
                    + '</div>'
                    + '<div class="modal-footer">'
                    + '<button type="button" class="btn btn-danger closepop" data-dismiss="modal">Close</button>'
                    + '</div>'
            ,
            html: true
        });
        $(this.el).popover('show');
        $('.closepop').click(function () {
            pop.destroy();
        });
    },
    destroy: function () {
        $(this.el).popover('destroy');
    }
});
//******************************************************************************
//                               CardDetailsView
//******************************************************************************

app.CardDetailsView = Backbone.View.extend({
    el: '.detailview',
    initialize: function () {
        this.render();
    },
    events: {
        'click .detclose': 'closeCard',
        'click .detdelete': 'deleteCard'
    },
    template: _.template(''
            + '<h2>Card Details</h2>'
            + '<table class="table table-striped table-hover ">'
            + ' <thead> '
            + '   <tr>'
            + '       <th><img src = "<% print(image) %>" alt = "thumbnail" class = "img-thumbnail" width ="300"></th>   '
            + '       <th><img src = "img/yu_gi1.png" alt = "thumbnail" class = "img-thumbnail" width ="300"></th> '
            + '   <tr>'
            + ' </thead>'
            + ' </table> '
            + ' <div class="panel panel-default">'
            + '     <div class="panel-heading">Name:</div><div class="panel-body"><% print(data.name) %></div>'
            + '      <div class="panel-heading">Type:</div><div class="panel-body"><% print(data.type) %></div>'
            + '     <div class="panel-heading">Text:</div><div class="panel-body"><% print(data.text) %></div>'
            + '    <div class="panel-heading">Card Type:</div><div class="panel-body"><% print(data.card_type) %></div>'
            + '   <div class="panel-heading">Family:</div><div class="panel-body"><% print(data.family) %></div>'
            + '  <div class="panel-heading">Attack:</div><div class="panel-body"><% print(data.atk) %></div>'
            + ' <div class="panel-heading">Defence:</div><div class="panel-body"><% print(data.def) %></div>'
            + ' <div class="panel-heading">Level:</div><div class="panel-body"><% print(data.level) %></div>'
            + '<div class="panel-heading">Property:</div><div class="panel-body"><% print(data.property) %></div>'

            + '</div><div class="modal-footer"> '
            + '  <a href="#" class="btn btn-warning detclose">Close Window</a>'
            + '  <a href="#" class="btn btn-danger pull-right detdelete">Delete Card</a>'
            + ' </div>'
            + ''),
    render: function () {

        var html = this.template(this.model.toJSON());
        $(this.el).html(html);
    },
    closeCard: function () {
        $(this.el).empty();
    },
    deleteCard: function () {

        myapp.instances.mycollection.remove(this.model);
        this.closeCard();
    }




});

