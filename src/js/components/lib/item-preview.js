import React, { Component } from 'react';
import classnames from 'classnames';
import moment from 'moment';
import { Link } from 'react-router-dom';
import { ItemSnippet } from '/components/lib/item-snippet';
import { TitleSnippet } from '/components/lib/title-snippet';

export class ItemPreview extends Component {
  constructor(props) {
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
  }

  render() {
    let date = moment(this.props.item.date).fromNow();
    let authorDate = `${this.props.item.author} • ${date}`
    let stackLink = "/~srrs/" +
      this.props.item.stackOwner + "/" +
      this.props.item.stackName;
    let itemLink = stackLink + "/" + this.props.item.itemName;

    return (
      <div className="w-336 relative"
        style={{height:195, marginBottom: 72, marginRight:16}}>
        <Link to={itemLink}>
          <TitleSnippet badge={this.props.item.unread} title={this.props.item.itemTitle}/>
          <ItemSnippet
            body={this.props.item.itemSnippet}
          />
        </Link>
        <p className="label-small gray-50 absolute" style={{bottom:0}}>
          {authorDate}
        </p>
      </div>
    );
  }
}