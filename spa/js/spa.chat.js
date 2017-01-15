/*
 * spa.chat.js
 * Chat feature module for SPA
*/

/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/

/*global $, spa, getComputedStyle */

spa.chat = (function () {
  //---------------- BEGIN MODULE SCOPE VARIABLES --------------
  var
    configMap = {
      main_html : String()
        + '<div class="spa-chat">'
          + '<div class="spa-chat-head">'
            + '<div class="spa-chat-head-toggle">+</div>'
            + '<div class="spa-chat-head-title">'
              + 'Chat'
            + '</div>'
          + '</div>'
          + '<div class="spa-chat-closer">x</div>'
          + '<div class="spa-chat-sizer">'
            + '<div class="spa-chat-msgs"></div>'
            + '<div class="spa-chat-box">'
              + '<input type="text"/>'
              + '<div>send</div>'
            + '</div>'
          + '</div>'
        + '</div>',
        //a map determines whether config arguments are settable
      settable_map : {
        slider_open_time    : true,
        slider_close_time   : true,
        slider_opened_em    : true,
        slider_closed_em    : true,
        slider_opened_title : true,
        slider_closed_title : true,

        chat_model      : true,
        people_model    : true,
        set_chat_anchor : true
      },

      //config arguments
      slider_open_time     : 250,
      slider_close_time    : 250,
      slider_opened_em     : 16,
      slider_closed_em     : 2,
      slider_opened_title  : 'Click to close',
      slider_closed_title  : 'Click to open',

      //for resize control
      slider_opened_min_em : 10,
      window_height_min_em : 20,

      chat_model      : null,
      people_model    : null,
      set_chat_anchor : null
    },
    stateMap  = { 
      // $container : null,
      $append_target   : null,
      position_type    : 'closed',
      px_per_em        : 0,
      slider_hidden_px : 0,
      slider_closed_px : 0,
      slider_opened_px : 0 
    },
    jqueryMap = {},

    setJqueryMap, configModule, initModule,
    getEmSize, setPxSizes, setSliderPosition,
    onClickToggle,
    removeSlider, onClickRemoveSlider,
    handleResize,
    sliderStateEnum
    ;
  //----------------- END MODULE SCOPE VARIABLES ---------------

  //------------------- BEGIN UTILITY METHODS ------------------
  getEmSize = function ( elem ) {
    return Number(
      getComputedStyle( elem, '' ).fontSize.match(/\d*\.?\d*/)[0]
    );
  };

  //enum for slider state
  sliderStateEnum = (function(){
    var openedState = 'opened';
    var closedState = 'closed';
    var hiddenState = 'hidden';
    return {
      OPENED:openedState,
      CLOSED:closedState,
      HIDDEN:hiddenState
    };
  })();

  //-------------------- END UTILITY METHODS -------------------

  //--------------------- BEGIN DOM METHODS --------------------
  // Begin DOM method /setJqueryMap/
  setJqueryMap = function () {
    // var $container = stateMap.$container;
    // jqueryMap = { $container : $container };

    var
      $append_target = stateMap.$append_target,
      $slider        = $append_target.find( '.spa-chat' );

    jqueryMap = {
      $slider : $slider,
      $head   : $slider.find( '.spa-chat-head' ),
      $toggle : $slider.find( '.spa-chat-head-toggle' ),
      $title  : $slider.find( '.spa-chat-head-title' ),
      $sizer  : $slider.find( '.spa-chat-sizer' ),
      $msgs   : $slider.find( '.spa-chat-msgs' ),
      $box    : $slider.find( '.spa-chat-box' ),
      $input  : $slider.find( '.spa-chat-input input[type=text]'),
      $spaChatCloser: $slider.find('.spa-chat-closer')
    };
  };
  // End DOM method /setJqueryMap/

//TODO: what it means?
//calculate the pixel sizes for elements
  setPxSizes = function () {
      var px_per_em, 
      opened_height_em,
      window_height_em;

      px_per_em = getEmSize( jqueryMap.$slider.get(0) );

      window_height_em = Math.floor(
      ( $(window).height() / px_per_em ) + 0.5
    );

      opened_height_em
      = window_height_em > configMap.window_height_min_em
      ? configMap.slider_opened_em
      : configMap.slider_opened_min_em;

      stateMap.px_per_em        = px_per_em;
      stateMap.slider_closed_px = configMap.slider_closed_em * px_per_em;
      stateMap.slider_opened_px = opened_height_em * px_per_em;
      jqueryMap.$sizer.css({
        height : ( opened_height_em - 2 ) * px_per_em
      });
    };

// Begin public method /setSliderPosition/
  // Example   : spa.chat.setSliderPosition( 'closed' );
  // Purpose   : Move the chat slider to the requested position
  // Arguments :
  //   * position_type - enum('closed', 'opened', or 'hidden')
  //   * callback - optional callback to be run end at the end
  //     of slider animation.  The callback receives a jQuery
  //     collection representing the slider div as its single
  //     argument
  // Action    :
  //   This method moves the slider into the requested position.
  //   If the requested position is the current position, it
  //   returns true without taking further action
  // Returns   :
  //   * true  - The requested position was achieved
  //   * false - The requested position was not achieved
  // Throws    : none
  //
  setSliderPosition = function ( position_type, callback ) {
    var
      height_px, animate_time, slider_title, toggle_text;

    // return true if slider already in requested position
    if ( stateMap.position_type === position_type ){
      return true;
    }

    // prepare animate parameters
    switch ( position_type ){
      case sliderStateEnum.OPENED :
        height_px    = stateMap.slider_opened_px;
        animate_time = configMap.slider_open_time;
        slider_title = configMap.slider_opened_title;
        toggle_text  = '=';
      break;

      case sliderStateEnum.HIDDEN :
        height_px    = 0;
        animate_time = configMap.slider_open_time;
        slider_title = '';
        toggle_text  = '+';
        return true;//for hidden case, do not need to perform the subsequent animation.

      case sliderStateEnum.CLOSED :
        height_px    = stateMap.slider_closed_px;
        animate_time = configMap.slider_close_time;
        slider_title = configMap.slider_closed_title;
        toggle_text  = '+';
      break;

      // bail for unknown position_type
      default : return false;
    }

    // animate slider position change
    stateMap.position_type = '';
    jqueryMap.$slider.show().animate(
      { height : height_px },
      animate_time,
      function () {
        jqueryMap.$toggle.prop( 'title', slider_title );
        jqueryMap.$toggle.text( toggle_text );
        stateMap.position_type = position_type;
        if ( callback ) { callback( jqueryMap.$slider ); }
      }
    );
    return true;
  };
  // End public DOM method /setSliderPosition/
  //---------------------- END DOM METHODS ---------------------

  //------------------- BEGIN EVENT HANDLERS -------------------
  //click event handler to response to user action, set the anchor
  onClickToggle = function ( event ){
    var set_chat_anchor = configMap.set_chat_anchor;
    if ( stateMap.position_type === sliderStateEnum.OPENED ) {
      set_chat_anchor( sliderStateEnum.CLOSED );
    }
    else if ( stateMap.position_type === sliderStateEnum.CLOSED ){
      set_chat_anchor( sliderStateEnum.OPENED );
    }
    return false;
  };

  //click event handler to response to close slider action
  onClickRemoveSlider = function(event){
    //removeSlider();
    var set_chat_anchor = configMap.set_chat_anchor;
    //trigger hash change
    set_chat_anchor(sliderStateEnum.HIDDEN);

    return false;
  }

  //-------------------- END EVENT HANDLERS --------------------

  //------------------- BEGIN PUBLIC METHODS -------------------
  // Begin public method /configModule/
  // Example   : spa.chat.configModule({ slider_open_em : 18 });
  // Purpose   : Configure the module prior to initialization
  // Arguments :
  //   * set_chat_anchor - a callback to modify the URI anchor to
  //     indicate opened or closed state. This callback must return
  //     false if the requested state cannot be met
  //   * chat_model - the chat model object provides methods
  //       to interact with our instant messaging
  //   * people_model - the people model object which provides
  //       methods to manage the list of people the model maintains
  //   * slider_* settings. All these are optional scalars.
  //       See mapConfig.settable_map for a full list
  //       Example: slider_open_em is the open height in em's
  // Action    :
  //   The internal configuration data structure (configMap) is
  //   updated with provided arguments. No other actions are taken.
  // Returns   : true
  // Throws    : JavaScript error object and stack trace on
  //             unacceptable or missing arguments
  //
  configModule = function ( input_map ) {
    spa.util.setConfigMap({
      input_map    : input_map,
      settable_map : configMap.settable_map,
      config_map   : configMap
    });
    return true;
  };
  // End public method /configModule/

  // Begin public method /initModule/
  // Purpose    : Initializes module
  // Arguments  :
  //  * $container the jquery element used by this feature
  // Returns    : true
  // Throws     : none
  //
  initModule = function ( $append_target ) {
    $append_target.append( configMap.main_html );
    // stateMap.$container = $container;
    stateMap.$append_target = $append_target;

    //cached jquery object based on $append_target
    setJqueryMap();
    //instantiate the size according to device
    setPxSizes();

    //init chat slider's title and state
    jqueryMap.$toggle.prop('title', configMap.slider_closed_title);
    jqueryMap.$head.on('click', onClickToggle);
    stateMap.position_type='closed';

    //init event handler to chat closer
    jqueryMap.$spaChatCloser.on('click', onClickRemoveSlider);

    return true;
  };
  // End public method /initModule/

  //begin public method: removeSlider
  removeSlider = function(){
    if(jqueryMap.$slider){
      jqueryMap.$slider.hide();
      //empty jqueryMap to release unuse object
      // jqueryMap = {};
    }

    //update state map
    stateMap.$append_target = null;
    stateMap.position_type = sliderStateEnum.HIDDEN;

    //update config map
    configMap.chat_model = null;
    configMap.people_model = null;
    // configMap.set_chat_anchor = null;

    return true;

  };

  //public method: handleResize
  handleResize = function(){
    if(!jqueryMap.$slider){
      return false;
    }

    setPxSizes();

    //set slider style
    if(stateMap.position_type === sliderStateEnum.OPENED){
      jqueryMap.$slider.css({height: stateMap.slider_opened_px});
    }
    return true;
  };

  // return public methods
  return {
    configModule : configModule,
    initModule   : initModule,
    setSliderPosition:setSliderPosition,
    removeSlider: removeSlider,
    sliderStateEnum: sliderStateEnum,
    handleResize: handleResize
  };
  //------------------- END PUBLIC METHODS ---------------------
}());
