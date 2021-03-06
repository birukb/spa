/*
 * spa.fake.js
 * fake module
*/

/*jslint    browser : true, continue : true, devel : true, indent : 2, maxerr : 50,
newcap : true, nomen : true, plusplus : true, regexp : true, sloppy : true, vars : true,
white : true
*/

/*global spa */

spa.fake = (function () {
    'use strict';
    var peopleList, fakeIdSerial, makeFakeId, mockSio;

    fakeIdSerial = 5;

    makeFakeId = function () {
        return 'id_' + String(fakeIdSerial++);
    };

    peopleList = (function () {
        return [
            {
                name: 'Betty', _id: 'id_01',
                css_map: { top: 20, left: 20, 'background-color': 'rgb(128, 128, 128)' }
            },
            {
                name: 'Mike', _id: 'id_02',
                css_map: { top: 60, left: 20, 'background-color': 'rgb(128, 255, 128)' }
            },
            {
                name: 'Pebbles', _id: 'id_03',
                css_map: { top: 100, left: 20, 'background-color': 'rgb(128, 192, 192)' }
            }
        ];
    }());

    mockSio = (function () {
        var callback_map = {},
            send_listchange, on_sio, emit_sio,
            emit_mock_msg;

        on_sio = function (msg_type, callback) {
            callback_map[msg_type] = callback;
        };

        emit_sio = function (msg_type, data) {
            var person_map;
            if (msg_type === 'adduser' && callback_map.userupdate) {
                setTimeout(function () {
                    person_map = {
                        _id: makeFakeId(),
                        name: data.name,
                        css_map: data.css_map
                    };
                    peopleList.push(person_map);
                    callback_map.userupdate([person_map]);
                }, 3000);
            }

            if (msg_type === 'updatechat' && callback_map.updatechat) {
                setTimeout(function () {
                    var user = spa.model.people.get_user();
                    callback_map.updatechat([{
                        dest_id: user.id,
                        dest_name: user.name,
                        sender_id: data.dest_id,
                        msg_text: 'Thanks for the note, ' + user.name
                    }]);
                }, 2000);

                if (msg_type === 'leavechat') {
                    callback_map = {};
                }
            }
        };
        //End emit_sio

        emit_mock_msg = function () {
            setTimeout(function () {
                var user = spa.model.people.get_user();
                if (callback_map.updatechat) {
                    callback_map.updatechat([{
                        dest_id: user.id,
                        dest_name: user.name,
                        sender_id: 'id_04',
                        msg_text: 'Hi there ' + user.name + '! Wilma here.'
                    }]);
                }
                else { emit_mock_msg(); }
            }, 8000);
        };
        //End emit_mock_msg

        send_listchange = function () {
            setTimeout(function () {
                if (callback_map.listchange) {
                    callback_map.listchange([peopleList]);
                    emit_mock_msg();
                }
                else { send_listchange(); }
            }, 1000);
        };
        //End send_listchange

        // Start the process ... 
        send_listchange();

        return { emit: emit_sio, on: on_sio };
    }());

    return { mockSio: mockSio };
}());