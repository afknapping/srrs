import React, { Component } from 'react';
import classnames from 'classnames';
import cx from 'classnames-es';
import moment from 'moment';
import { Link } from 'react-router-dom';
import { ItemBody } from '/components/lib/item-body';
import { PathControl } from '/components/lib/path-control';
import { NextPrev } from '/components/lib/next-prev';
import { NotFound } from '/components/not-found';
import { withRouter } from 'react-router';
import Choices from 'react-choices'
import _ from 'lodash';

const NF = withRouter(NotFound);

class Admin extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    if (!this.props.enabled){
      return null;
    } else if (this.props.mode === 'view'){
      return (

        <div className="flex-col fr">

          <p className="label-regular gray-50 pointer tr b"
            onClick={this.props.gradeItem}>
            Grade
          </p>

          <p className="label-regular gray-50 pointer tr b"
             onClick={this.props.editItem}>
            Edit
          </p>
          <p className="label-regular red pointer tr b"
             onClick={this.props.deleteItem}>
            Delete
          </p>
        </div>
      );
    } else if (this.props.mode === 'edit'){
      return (
        <div className="body-regular flex-col fr">
          <p className="pointer"
             onClick={this.props.saveItem}>
            -> Save
          </p>
          <p className="pointer"
             onClick={this.props.deleteItem}>
            Delete item
          </p>
        </div>
      );
    } else if (this.props.mode === 'grade'){
      let modifyButtonClasses = "mt4 db f9 ba pa2 white-d bg-gray0-d b--black b--gray2-d pointer";
      return (
        <div className="body-regular flex-col fr">
        
        <Choices
            name="recall_grade"
            label="grade"
            availableStates={[
              { value: 'again' },
              { value: 'hard' },
              { value: 'good' },
              { value: 'easy' }
            ]}
            defaultValue="again"
          >
            {({
              name,
              label,
              states,
              selectedValue,
              setValue,
              hoverValue
            }) => (
                 
                <div
                  className="choices"
                >
                  <p className="pointer"
                    onClick={this.props.saveGrade}>
                    ->  Save Grade
                  </p>

                  <div id={`choices__label-${name}`} className="choices__label">
                    {label}
                  </div>
                  <div className="choices__items">
                    {states.map((state, idx) => (
                      <button
                        key={`choice-${idx}`}
                        id={`choice-${state.value}`}
                        tabIndex={state.selected ? 0 : -1}
                        className={classnames('choice', state.inputClassName, {
                          'choice--focused': state.focused,
                          'outline-m': state.hovered,
                          'bg-green': state.selected
                        }, modifyButtonClasses)}
                        onMouseOver={hoverValue.bind(null, state.value)}
                        onClick={() => {
                          setValue(state.value);
                          this.props.setGrade(state.value);
                        }
                        }
                      >
                        {state.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
          </Choices>
          </div>
      );
    }

  }
}

export class Item extends Component {
  constructor(props){
    super(props);

    moment.updateLocale('en', {
      relativeTime: {
        past: function(input) {
          return input === 'just now'
            ? input
            : input + ' ago'
        },
        s : 'just now',
        future : 'in %s',
        m  : '1m',
        mm : '%dm',
        h  : '1h',
        hh : '%dh',
        d  : '1d',
        dd : '%dd',
        M  : '1 month',
        MM : '%d months',
        y  : '1 year',
        yy : '%d years',
      }
    });

    this.state = {
      mode: 'view',
      titleOriginal: '',
      bodyOriginal: '',
      title: '',
      body: '',
      recallGrade: '',
      awaitingEdit: false,
      awaitingGrade: false,
      awaitingLoad: false,
      awaitingDelete: false,
      ship: this.props.ship,
      stackId: this.props.stackId,
      itemId: this.props.itemId,
      stack: null,
      item: null,
      pathData: [],
      temporary: false,
      notFound: false,
    }

    this.editItem = this.editItem.bind(this);
    this.deleteItem = this.deleteItem.bind(this);
    this.saveItem = this.saveItem.bind(this);
    this.titleChange = this.titleChange.bind(this);
    this.bodyChange = this.bodyChange.bind(this);
    this.gradeItem = this.gradeItem.bind(this);
    this.setGrade = this.setGrade.bind(this);
    this.saveGrade = this.saveGrade.bind(this);

  }

  editItem() {
    this.setState({mode: 'edit'});
  }

  gradeItem() {
    this.setState({mode: 'grade'});
  }
  setGrade(value) {
    this.setState({recallGrade: value});
  }
  saveItem() {
    if (this.state.title == this.state.titleOriginal &&
        this.state.body == this.state.bodyOriginal) {
      this.setState({mode: 'view'});
      return;
    }

    this.props.setSpinner(true);
    let permissions = {
      read: {
        mod: 'black',
        who: [],
      },
      write: {
        mod: 'white',
        who: [],
      }
    };

    let data = {
      "edit-item": {
        who: this.state.ship,
        stack: this.props.stackId,
        name: this.props.itemId,
        title: this.state.title,
        perm: permissions,
        content: this.state.body,

      },
    };

    this.setState({
      awaitingEdit: {
        ship: this.state.ship,
        stackId: this.props.stackId,
        itemId: this.props.itemId,
      }
    }, () => {
      this.props.api.action("srrs", "srrs-action", data)
    });
  }
  saveGrade() {
    this.props.setSpinner(true);
    let data = {
      "answered-item": {
        stak: this.props.stackId,
        item: this.props.itemId,
        answer: this.state.recallGrade
      },
    };
    console.log(data);
    this.setState({
      awaitingGrade: {
        ship: this.state.ship,
        stackId: this.props.stackId,
        itemId: this.props.itemId,
      }
    }, () => {
      this.props.api.action("srrs", "srrs-action", data)
    });
  }

  componentWillMount() {
    let ship = this.props.ship;
    let stackId = this.props.stackId;
    let itemId = this.props.itemId;

    if (ship !== window.ship) {

      let stack = _.get(this.props, `subs["${ship}"]["${stackId}"]`, false);

      if (stack) {
        let item = _.get(stack, `items["${itemId}"].item`, false);
        let stackUrl = `/~srrs/${stack.info.owner}/${stack.info.filename}`;
        let itemUrl = `${stackUrl}/${item["note-id"]}`;

        this.setState({
          titleOriginal: item.title,
          bodyOriginal: item.file,
          title: item.title,
          body: item.file,
          stack: stack,
          item: item,
          pathData: [
            { text: "Home", url: "/~srrs/review" },
            { text: stack.info.title, url: stackUrl },
            { text: item.title, url: itemUrl },
          ],
        });

        let read = {
          read: {
            who: ship,
            stack: stackId,
            item: itemId,
          }
        };
        this.props.api.action("srrs", "srrs-action", read);

      } else {
        this.setState({
          awaitingLoad: {
            ship: ship,
            stackId: stackId,
            itemId: itemId,
          },
          temporary: true,
        });

        this.props.setSpinner(true);

        this.props.api.bind(`/stack/${stackId}`, "PUT", ship, "srrs",
          this.handleEvent.bind(this),
          this.handleError.bind(this));
      }
    } else {
      let stack = _.get(this.props, `pubs["${stackId}"]`, false);
      let item = _.get(stack, `items["${itemId}"].item`, false);

      if (!stack || !item) {
        this.setState({notFound: true});
        return;
      } else {
        let stackUrl = `/~srrs/${stack.info.owner}/${stack.info.filename}`;
        let itemUrl = `${stackUrl}/${item["note-id"]}`;

        this.setState({
          titleOriginal: item.title,
          bodyOriginal: item.file,
          title: item.title,
          body: item.file,
          stack: stack,
          item: item,
          pathData: [
            { text: "Home", url: "/~srrs/review" },
            { text: stack.info.title, url: stackUrl },
            { text: item.title, url: itemUrl },
          ],
        });
      }
    }
  }

  handleEvent(diff) {
    if (diff.data.total) {
      let stack = diff.data.total.data;
      let item = stack.items[this.state.itemId].item;
      let stackUrl = `/~srrs/${stack.info.owner}/${stack.info.filename}`;
      let itemUrl = `${stackUrl}/${item["note-id"]}`;

      this.setState({
        awaitingLoad: false,
        titleOriginal: item.title,
        bodyOriginal: item.file,
        title: item.title,
        body: item.file,
        stack: stack,
        item: item,
        pathData: [
          { text: "Home", url: "/~srrs/review" },
          { text: stack.info.title, url: stackUrl },
          { text: item.info.title, url: itemUrl },
        ],
      });

      this.props.setSpinner(false);

    } else if (diff.data.stack) {
      let newStack = this.state.stack;
      newStack.info = diff.data.stack.data;
      this.setState({
        stack: newStack,
      });
    } else if (diff.data.item) {
      this.setState({
        item: diff.data.item.data,
      });
    } else if (diff.data.remove) {
      // XX TODO Handle this properly
    }
  }

  handleError(err) {
    this.props.setSpinner(false);
    this.setState({notFound: true});
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.notFound) return;

    let ship   = this.props.ship;
    let stackId = this.props.stackId;
    let itemId = this.props.itemId;

    let oldItem = prevState.item;
    let oldStack = prevState.stack;

    let item;
    let stack;

    if (ship === window.ship) {
      stack = _.get(this.props, `pubs["${stackId}"]`, false);
      item = _.get(stack, `items["${itemId}"].item`, false);
    } else {
      stack = _.get(this.props, `subs["${ship}"]["${stackId}"]`, false);
      item = _.get(stack, `items["${itemId}"].item`, false);
    }


    if (this.state.awaitingDelete && (item === false) && oldItem) {
      this.props.setSpinner(false);
      let redirect = `/~srrs/~${this.props.ship}/${this.props.stackId}`;
      this.props.history.push(redirect);
      return;
    }

    if (!stack || !item) {
      this.setState({notFound: true});
      return;
    }

    if (this.state.awaitingEdit &&
       ((itemtitle != oldItem.title) ||
        (item.raw != oldItem.raw))) {

      let stackUrl = `/~srrs/${stack.info.owner}/${stack.info.filename}`;
      let itemUrl = `${stackUrl}/${item["note-id"]}`;

      this.setState({
        mode: 'view',
        titleOriginal: item.title,
        bodyOriginal: item.file,
        title: item.title,
        body: item.file,
        awaitingEdit: false,
        item: item,
        pathData: [
          { text: "Home", url: "/~srrs/review" },
          { text: stack.info.title, url: stackUrl },
          { text: item.title, url: itemUrl },
        ],
      });

      this.props.setSpinner(false);

      let read = {
        read: {
          who: ship,
          stak: stackId,
          item: itemId,
        }
      };
      this.props.api.action("srrs", "srrs-action", read);
    }

    if (this.state.awaitingGrade ) {
      console.log("here");
     let stackUrl = `/~srrs/${stack.info.owner}/${stack.info.filename}`;
     let itemUrl = `${stackUrl}/${item["note-id"]}`;

     this.setState({
       mode: 'view',
       titleOriginal: item.title,
       bodyOriginal: item.file,
       title: item.title,
       body: item.file,
       awaitingGrade: false,
       item: item,
       pathData: [
         { text: "Home", url: "/~srrs/review" },
         { text: stack.info.title, url: stackUrl },
         { text: item.title, url: itemUrl },
       ],
     });

     this.props.setSpinner(false);

     let read = {
       read: {
         who: ship,
         stak: stackId,
         item: itemId,
       }
     };
     this.props.api.action("srrs", "srrs-action", read);
   }
    if (!this.state.temporary){
      if (oldItem != item) {
        let stackUrl = `/~srrs/${stack.info.owner}/${stack.info.filename}`;
        let itemUrl = `${stackUrl}/${item["note-id"]}`;

        this.setState({
          titleOriginal: item.title,
          bodyOriginal: item.file,
          item: item,
          title: item.title,
          body: item.file,
          pathData: [
            { text: "Home", url: "/~srrs/review" },
            { text: stack.info.title, url: stackUrl },
            { text: item.title, url: itemUrl },
          ],
        });

        let read = {
          read: {
            who: ship,
            stak: stackId,
            item: itemId,
          }
        };
        this.props.api.action("srrs", "srrs-action", read);
      }
      
      if (oldStack != stack) {
        this.setState({stack: stack});
      }
    }
  }

  deleteItem(){
    let del = {
      "delete-item": {
        stak: this.props.stackId,
        item: this.props.itemId,
      }
    };
    this.props.setSpinner(true);
    this.setState({
      awaitingDelete: {
        ship: this.props.ship,
        stackId: this.props.stackId,
        itemId: this.props.itemId,
      }
    }, () => {
      this.props.api.action("srrs", "srrs-action", del);
    });
  }

  titleChange(evt){
    this.setState({title: evt.target.value});
  }

  bodyChange(evt){
    this.setState({body: evt.target.value});
  }

  gradeChange(evt){
    this.setState({recallGrade: evt.target.value});
  }

  render() {
    let adminEnabled = (this.props.ship === window.ship);

    if (this.state.notFound) {
      return (
        <NF/>
      );
    } else if (this.state.awaitingLoad) {
      return null;
    } else if (this.state.awaitingEdit) {
      return null;
    } else if (this.state.mode == 'view' || this.state.mode == 'grade') {
      let stackLink = `/~srrs/~${this.state.ship}/${this.props.stackId}`;
      let stackLinkText = `<- Back to ${this.state.stack.info.title}`;

      let date = moment(this.state.item["date-created"]).fromNow();
      let authorDate = `${this.state.item.author} • ${date}`;
      let create = (this.props.ship === window.ship);
      return (
        <div>
          <PathControl pathData={this.state.pathData} create={create}/>
          <div className="absolute w-100" style={{top:124}}>
            <div className="mw-688 center mt4 flex-col" style={{flexBasis: 688}}>
              <Link to={stackLink}>
                <p className="body-regular one-line mw-688">
                  {stackLinkText}
                </p>
              </Link>

              <h2 style={{wordWrap: "break-word"}}>{this.state.titleOriginal}</h2>

              <div className="mb4">
                <p className="fl label-small gray-50">{authorDate}</p>
                <Admin
                  enabled={adminEnabled}
                  mode={this.state.mode}
                  editItem={this.editItem}
                  deleteItem={this.deleteItem}
                  gradeItem={this.gradeItem}
                  setGrade={this.setGrade}
                  saveGrade={this.saveGrade}
                />
              </div>

              <div className="cb">
                <ItemBody
                  body={this.state.item.file}
                />
              </div>

              <hr className="gray-50 w-680 mt4"/>
              <NextPrev stack={this.state.stack} itemId={this.props.itemId} />
            </div>
          </div>
        </div>
      );

    } else if (this.state.mode == 'edit') {
      let stackLink = `/~srrs/~${this.state.ship}/${this.props.stackId}`;
      let stackLinkText = `<- Back to ${this.state.stack.info.title}`;

      let date = moment(this.state.item["date-created"]).fromNow();
      let authorDate = `${this.state.item.author} • ${date}`;
      let create = (this.props.ship === window.ship);
      return (
        <div>
          <PathControl pathData={this.state.pathData} create={create}/>
          <div className="absolute w-100" style={{top:124}}>
            <div className="mw-688 center mt4 flex-col" style={{flexBasis: 688}}>
              <Link to={stackLink}>
                <p className="body-regular">
                  {stackLinkText}
                </p>
              </Link>

              <input autoFocus className="header-2 b--none w-100"
                type="text"
                name="itemName"
                defaultValue={this.state.titleOriginal}
                onChange={this.titleChange}
              />

              <div className="mb4">
                <p className="fl label-small gray-50">{authorDate}</p>
                <Admin
                  enabled={adminEnabled}
                  mode="edit"
                  saveItem={this.saveItem}
                  deleteItem={this.deleteItem}
                />
              </div>

              <textarea className="cb b--none body-regular-400 w-100 h5"
                style={{resize:"none"}}
                type="text"
                name="itemBody"
                onChange={this.bodyChange}
                defaultValue={this.state.bodyOriginal}>
              </textarea>

              <hr className="gray-50 w-680 mt4"/>
              <NextPrev stack={this.state.stack} itemId={this.props.itemId} />

            </div>
          </div>
        </div>
      );
    }
  }
}
