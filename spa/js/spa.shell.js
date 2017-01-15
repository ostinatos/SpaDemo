/*
 * spa.shell.js
 * Shell module for SPA
*/

/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/
/*global $, spa */

spa.shell = (function () {
  'use strict';
  //---------------- BEGIN MODULE SCOPE VARIABLES --------------
  var
    configMap = {
      main_html: String()
      + '<div class="spa-shell-head">'
      + '<div class="spa-shell-head-logo">'
      + '<h1>SPA</h1>'
      + '<p>javascript end to end</p>'
      + '</div>'
      + '<div class="spa-shell-head-acct"></div>'
      + '</div>'
      + '<div class="spa-shell-main">'
      + '<div class="spa-shell-main-nav"></div>'
      + '<div class="spa-shell-main-content"></div>'
      + '</div>'
      + '<div class="spa-shell-foot"></div>'
      + '<div class="spa-shell-modal"></div>',
      chat_extend_time: 1000,
      chat_retract_time: 300,
      chat_extend_height: 450,
      chat_retract_height: 15,
      chat_extended_title: 'Click to retract',
      chat_retracted_title: 'Click to extend',
      anchor_schema_map: {
        chat: {
          opened: true,
          closed: true
        }
      }
    },
    stateMap = {
      $container: null,
      // is_chat_retracted : true,
      anchor_map: {}
    },
    jqueryMap = {},

    setJqueryMap, initModule,
    onClickChat, 
    // toggleChat,
    setChatAnchor,
    copyAnchorMap,
    changeAnchorPart,
    onHashchange,
    onTapAccount,
    onLogin,
    onLogout;
  //----------------- END MODULE SCOPE VARIABLES ---------------

  //-------------------- BEGIN UTILITY METHODS -----------------
  copyAnchorMap = function () {
    return $.extend(true, {}, stateMap.anchor_map);
  };
  //--------------------- END UTILITY METHODS ------------------

  //--------------------- BEGIN DOM METHODS --------------------
  // Begin DOM method /setJqueryMap/
  setJqueryMap = function () {
    var $container = stateMap.$container;
    jqueryMap = {
      $container: $container,
      $acct: $container.find('.spa-shell-head-acct'),
      $nav: $container.find('.spa-shell-main-nav')
      // $chat: $container.find('.spa-shell-chat')    
    };
  };

  //change anchor part
  changeAnchorPart = function (arg_map) {
    var
      anchor_map_revise = copyAnchorMap(),
      bool_return = true,
      key_name, key_name_dep;

    // Begin merge changes into anchor map
    // KEYVAL:
    for (key_name in arg_map) {
      if (arg_map.hasOwnProperty(key_name)) {

        // skip dependent keys during iteration
        if (key_name.indexOf('_') === 0) {
          // continue KEYVAL;
          continue;
        }

        // update independent key value
        anchor_map_revise[key_name] = arg_map[key_name];

        // update matching dependent key
        key_name_dep = '_' + key_name;
        if (arg_map[key_name_dep]) {
          anchor_map_revise[key_name_dep] = arg_map[key_name_dep];
        }
        else {
          delete anchor_map_revise[key_name_dep];
          delete anchor_map_revise['_s' + key_name_dep];
        }
      }
    }
    // End merge changes into anchor map

    // Begin attempt to update URI; revert if not successful
    try {
      $.uriAnchor.setAnchor(anchor_map_revise);
    }
    catch (error) {
      // replace URI with existing state
      $.uriAnchor.setAnchor(stateMap.anchor_map, null, true);
      bool_return = false;
    }
    // End attempt to update URI...

    return bool_return;
  };

  // toggleChat = function(do_extend, callback){
  //     var
  //     px_chat_ht = jqueryMap.$chat.height(),
  //     is_open    = px_chat_ht === configMap.chat_extend_height,
  //     is_closed  = px_chat_ht === configMap.chat_retract_height,
  //     is_sliding = ! is_open && ! is_closed;

  //     // avoid race condition
  //     if ( is_sliding ){ return false; }

  //     // Begin extend chat slider
  //   if ( do_extend ) {
  //     jqueryMap.$chat.animate(
  //       { height : configMap.chat_extend_height },
  //       configMap.chat_extend_time,
  //       function () {//callback function for extending the chat panel
  //           jqueryMap.$chat.attr(
  //               'title', configMap.chat_extended_title
  //           );

  //           //modify chat panel state
  //           stateMap.is_chat_retracted = false;

  //         if ( callback ){ callback( jqueryMap.$chat ); }
  //       }
  //     );
  //     return true;
  //   }

  //   //begin retract chat slider
  //   jqueryMap.$chat.animate(
  //       {height:configMap.chat_retract_height},
  //       configMap.chat_retract_time,
  //       function(){
  //           jqueryMap.$chat.attr(
  //               'title', configMap.chat_retracted_title
  //           );
  //           //modify chat slider state
  //           stateMap.is_chat_retracted = true;

  //           //invoke callback
  //         if ( callback ){ callback( jqueryMap.$chat ); }            
  //       } );

  // };

  //event handler for clicking chat slider
  onClickChat = function () {
    //   toggleChat(stateMap.is_chat_retracted);
    //use uri anchor to change application state instead of directly call action handler
    changeAnchorPart({
      chat: (stateMap.is_chat_retracted ? 'open' : 'closed')
    });
    return false;
  };
  // End DOM method /setJqueryMap/

  //event handler for tapping account div
  onTapAccount = function (event) {
    var acct_text, user_name, user = spa.model.people.get_user();
    if (user.get_is_anon()) {
      user_name = prompt('Please sign-in');
      spa.model.people.login(user_name);
      jqueryMap.$acct.text('... processing ...');
    }
    else {
      spa.model.people.logout();
    }
    return false;
  };

  //--------------------- END DOM METHODS ----------------------

  //------------------- BEGIN EVENT HANDLERS -------------------
  onHashchange = function (event) {

    var
      anchor_map_previous = copyAnchorMap(),
      anchor_map_proposed,
      is_ok = true;

    //   console.log($.uriAnchor.makeAnchorMap());

    //parse parameters from uri anchor
    try {
      anchor_map_proposed = $.uriAnchor.makeAnchorMap();
    }
    catch (error) {
      $.uriAnchor.setAnchor(anchor_map_previous, null, true);
      return false;
    }
    stateMap.anchor_map = anchor_map_proposed;//save applied anchor map to state map

    //mapping parameters to application states, and perform related actions
    //behavior about chat slider
    if (anchor_map_proposed.chat
      && anchor_map_proposed.chat != anchor_map_previous.chat) {
      switch (anchor_map_proposed.chat) {
        case 'opened':
          // toggleChat(true);
          is_ok = spa.chat.setSliderPosition('opened');
          break;
        case 'closed':
          // toggleChat(false);
          is_ok = spa.chat.setSliderPosition('closed');
          break;
        default:
          // toggleChat(false);
          spa.chat.setSliderPosition('closed');
          delete anchor_map_proposed.chat;//delete unformal parameters
          $.uriAnchor.setAnchor(anchor_map_proposed, null, true);
          break;
      }
    }

    if (!is_ok) {
      if (anchor_map_previous) {
        $.uriAnchor.setAnchor(anchor_map_previous, null, true);
        statemap.anchor_map = anchor_map_previous;
      }
      else {
        delete anchor_map_proposed.chat;
        $.uriAnchor.setAnchor(anchor_map_previous, null, true);
      }
    }

    return false;

  }

  onLogin = function (event, login_user) {
    jqueryMap.$acct.text(login_user.name);
  };
  onLogout = function (event, logout_user) {
    jqueryMap.$acct.text('Please sign-in');
  };

  //-------------------- END EVENT HANDLERS --------------------

  //callback for setting chat anchor
  setChatAnchor = function (position_type) {
    return changeAnchorPart({ chat: position_type });
  };


  //------------------- BEGIN PUBLIC METHODS -------------------
  // Begin Public method /initModule/
  initModule = function ($container) {
    stateMap.$container = $container;
    $container.html(configMap.main_html);
    setJqueryMap();

    //init chat slider
    // stateMap.is_chat_retracted = true;
    // jqueryMap.$chat
    // .attr('title', configMap.chat_retracted_title)
    // .on('click', onClickChat);

    //init chat module
    spa.chat.configModule({
      set_chat_anchor: setChatAnchor,
      chat_model: spa.model.chat,
      people_model: spa.model.people
    });
    spa.chat.initModule(jqueryMap.$container);

    //set schema to uriAnchor, so that it can check unformal arguments
    $.uriAnchor.configModule({
      schema_map: configMap.anchor_schema_map
    });

    //bind onhashchange event handler
    $(window)
      .on('hashchange', onHashchange)
      .trigger('hashchange');//ensure hashchange event trigger for initial request

      //bind user tab event handler
    jqueryMap.$acct
      .text('Please sign-in')
      .bind('utap', onTapAccount);
  

  //subscribe event
  $.gevent.subscribe($container, 'spa-login', onLogin);
  $.gevent.subscribe($container, 'spa-logout', onLogout);

  // test toggle
  // setTimeout( function () {toggleChat( true ); }, 3000 );
  // setTimeout( function () {toggleChat( false );}, 8000 );
};
// End PUBLIC method /initModule/

return { initModule: initModule };
  //------------------- END PUBLIC METHODS ---------------------
} ());
