/*jslint    browser : true, continue : true, devel : true, indent : 2, maxerr : 50,
newcap : true, nomen : true, plusplus : true, regexp : true, sloppy : true, vars : true,
white : true
*/

/*global $, spa */

spa.shell = (function () {
    'use strict';
    var configMap = {
        anchor_schema_map: {
            chat: { opened: true, closed: true }
        },
        main_html:
             '<div class="spa-shell-head">'
                + '<div class="spa-shell-head-logo">'
                    + '<h1>SPA</h1>'
                    + '<p>javascript rocks</p>'
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
        resize_interval: 200,
        chat_extended_title: 'Click to retract',
        chat_retracted_title: 'Click to extend'
    },
    stateMap = {
        anchor_map: {}
    },
    jqueryMap = {},
    copyAnchorMap, setJqueryMap, changeAnchorPart,
    onResize, onHashChaged, onTapAcct,
    setChatAnchor, onLogin, onLogout,
    initModule;

    copyAnchorMap = function () {
        return $.extend(true, {}, stateMap.anchor_map);
    };
    //End copy anchor map

    changeAnchorPart = function (arg_map) {
        var anchor_map_revise = copyAnchorMap(),
            bool_return = true,
            key_name, key_name_dep;

        KEYVAL:
            for (key_name in arg_map) {
                // skip dependent keys during iteration
                if (arg_map.hasOwnProperty(key_name)) {

                    if (key_name.indexOf('_') === 0) { continue KEYVAL; }

                    // update independent key value
                    anchor_map_revise[key_name] = arg_map[key_name];

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

        try {
            $.uriAnchor.setAnchor(anchor_map_revise);
        } catch (error) {
            $.uriAnchor.setAnchor(stateMap.anchor_map, null, true);
            bool_return = false;
        }

        return bool_return;
    };
    //End change anchor part

    onHashChaged = function () {
        var
            _s_chat_previous, _s_chat_proposed, s_chat_proposed,
            anchor_map_proposed,
            is_ok = true,
            anchor_map_previous = copyAnchorMap();

        // attempt to parse anchore
        try {
            anchor_map_proposed = $.uriAnchor.makeAnchorMap();
        } catch (e) {
            $.uriAnchor.setAnchor(anchor_map_previous, null, true);
            return false;
        }
        stateMap.anchor_map = anchor_map_proposed;

        // convenience vars
        _s_chat_previous = anchor_map_previous._s_chat;
        _s_chat_proposed = anchor_map_proposed._s_chat;

        if (!anchor_map_previous
            || _s_chat_previous !== _s_chat_proposed) {
            s_chat_proposed = anchor_map_proposed.chat;
            switch (s_chat_proposed) {
                case 'opened':
                    is_ok = spa.chat.setSliderPosition('opened');
                    break;
                case 'closed':
                    is_ok = spa.chat.setSliderPosition('closed');
                    break;
                default:
                    is_ok = spa.chat.setSliderPosition('closed');
                    delete anchor_map_proposed.chat;
                    $.uriAnchor.setAnchor(anchor_map_proposed, null, true);
            }
        }

        if (!is_ok) {
            if (anchor_map_previous) {
                $.uriAnchor.setAnchor(anchor_map_previous, null, true);
                stateMap.anchor_map = anchor_map_previous;
            }
            else {
                delete anchor_map_proposed.chat;
                $.uriAnchor.setAnchor(anchor_map_proposed, null, true);
            }
        }

        return false;
    };
    //End onHashChaged

    setChatAnchor = function (position_type) {
        return changeAnchorPart({ chat: position_type });
    };
    //End setChatAnchor

    setJqueryMap = function () {
        var $container = stateMap.$container;
        jqueryMap = {
            $container: $container,
            $acct: $container.find('.spa-shell-head-acct'),
            $nav: $container.find('.spa-shel-main-nav')
        };
    };
    //End setJqueryMap

    onResize = function () {
        if (stateMap.resize_idto) { return true; }
        spa.chat.handleResize();

        stateMap.resize_idto = setTimeout(
            function () { stateMap.resize_idto = undefined; },
            configMap.resize_interval);

        return true;
    };
    //End onResize

    onTapAcct = function () {
        var user_name, user = spa.model.people.get_user();

        if(user.get_is_anon()){
            user_name = prompt('Please login');
            spa.model.people.login(user_name);
            jqueryMap.$acct.text('... processing ...');
        }
        else {
            spa.model.people.logout();
        }

        return false;
    };
    //End OnTapAcct

    onLogin = function (event, login_user) {
        jqueryMap.$acct.text(login_user.name);
    };
    //End OnLogin

    onLogout = function (event, logout_user) {
        jqueryMap.$acct.text('Please sign-in');
    };
    //End onLogout

    initModule = function ($container) {
        $container.html(configMap.main_html);
        stateMap.$container = $container;
        setJqueryMap();

        $.uriAnchor.configModule({
            schema_map: configMap.anchor_schema_map
        });

        spa.chat.configModule({
            set_chat_anchor: setChatAnchor,
            chat_model: spa.model.chat,
            people_model: spa.model.people
        });

        spa.chat.initModule(jqueryMap.$container);

        $(window)
            .bind('resize', onResize)
            .bind('hashchange', onHashChaged)
            .trigger('hashchange');

        $(spa)
            .bind('spa-login', onLogin)
            .bind('spa-logout', onLogout);

        jqueryMap.$acct
            .text('Please sign-in')
            .bind('utap', onTapAcct);
    };
    //End initModules

    return { initModule: initModule };
}());