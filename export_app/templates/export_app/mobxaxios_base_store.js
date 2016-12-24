import axios from '../config/axios-config';
import { observable } from 'mobx';

export default class Store {
  @observable records = [];

  endpoint = '';
  result = null;
  searchParam = 'search';

  transform(record) {
    return record;
  }

  get(id) {
    return axios.get(`${this.endpoint}/${id}`);
  }

  save(record) {
    let cache = [];
    const rv = JSON.parse(JSON.stringify(record, (key, value) => {
      if (key === 'store') {
        return;
      }
      if (typeof value === 'object' && value !== null) {
        if (cache.indexOf(value) !== -1) {
          // Circular reference found, discard key
          return;
        }
        // Store value in our collection
        cache.push(value);
      }
      return value;
    }));
    cache = null;
    if (record.id) {
      return axios.put(`${this.endpoint}/${record.id}`, rv).then(() => {
        record.is_error = false;
      }).catch(()=> {
        record.is_error = true;
      });
    } else {
      return axios.post(this.endpoint, rv).then((r) => {
        record.id = r.id;
        record.is_error = false;
      }).catch(() => {
        record.is_error = true;
      });
    }
  }

  _remove(record) {
    this.records.replace(this.records.filter(r => r !== record));
  }

  delete(record) {
    if (record.id) {
      return axios.delete(`${this.endpoint}/${record.id}`).then(() => {
        this._remove(record);
      }).catch(() => {
        record.is_error = true;
      });
    } else {
      this._remove(record);
    }
  }

  create() {
    this.records.unshift(this.transform({}));
  }

  search(value) {
    const search = {};
    search[this.searchParam] = value;
    this.fetchAll(search);
  }

  fetchAll(params) {
    axios.get(this.endpoint, {params}).then((records) => {
      if (this.result !== null) {
        records = records[this.result];
      }
      this.records.replace(records.map(this.transform));
    });
  }
}
