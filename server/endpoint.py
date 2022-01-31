import os
import re

from flask import Flask, request
from flask_cors import CORS
from flask_httpauth import HTTPBasicAuth
from orkg import ORKG

app = Flask(__name__)
cors = CORS(app, resources={r"/*": {"origins": "*"}})

orkg = ORKG(host="http://orkg.org/orkg/", simcomp_host="http://orkg.org/orkg/simcomp/")
auth = HTTPBasicAuth()


def start(port, host):
    app.run(port=port, host=host)


@auth.verify_password
def authenticate(login, password):
    if login == os.environ.get('ORKG_MAPPER_LOGIN', 'login') and password == os.environ.get('ORKG_MAPPER_PASSWORD', 'password'):
        return login


def find_mapping(value, prefix, client):
    clean_value = value.replace('_', ' ')
    possible_labels = client.get(q=clean_value).content
    # if there is only one label, use it
    if len(possible_labels) == 1:
        return f'{prefix}:' + possible_labels[0]['id']
    elif len(possible_labels) > 1:
        # if there are multiple labels, display a warning, but still choose the first one
        print('Multiple labels found for {}:{}. Using {}'.format(prefix, value, possible_labels[0]['id']))
        return f'{prefix}:' + possible_labels[0]['id']
    else:
        # if there are no labels, display a error message, and leave it as it is
        print('Error: No label found for {}:{}'.format(prefix, value))
        # log that the nothing was replaced
        return None


def translate_query(query, prefix, client):
    # create regular expression to get all values of the pattern "orkgx:<value>"
    pattern = prefix + r':([^\s]+)'
    # get all values of the pattern
    values = re.findall(pattern, query)
    # iterate over all values
    for value in values:
        # check if the id exist in the ORKG
        if client.exists(value):
            continue
        else:
            # if not, look up by label
            clean_value = value.replace('_', ' ')
            possible_labels = client.get(q=clean_value).content
            # if there is only one label, use it
            if len(possible_labels) == 1:
                # replace the value in the query with the id
                query = query.replace(f'{prefix}:' + value, f'{prefix}:' + possible_labels[0]['id'])
                # log that the value was replaced
                print(f"Replaced {value} with {possible_labels[0]['id']}")
            elif len(possible_labels) > 1:
                # if there are multiple labels, display a warning, but still choose the first one
                print('Multiple labels found for {}:{}. Using {}'.format(prefix, value, possible_labels[0]['id']))
                query = query.replace(f'{prefix}:' + value, f'{prefix}:' + possible_labels[0]['id'])
                # log that the value was replaced
                print(f"Replaced {value} with {possible_labels[0]['id']}")
            else:
                # if there are no labels, display a error message, and leave it as it is
                print('Error: No label found for {}:{}'.format(prefix, value))
                # log that the nothing was replaced
                print(f"No replacement for {value}")
    return query


@app.route('/map', methods=['GET'])
@auth.login_required
def map_label():
    label = request.args['label']
    truncated_label = label.split(':')[-1]
    if (mapped_label := find_mapping(truncated_label, 'orkgp', orkg.predicates)) is None:
        mapped_label = find_mapping(truncated_label, 'orkgr', orkg.resources)
    return {"mapping": label if mapped_label is None else mapped_label}


@app.route('/translate', methods=['POST'])
@auth.login_required
def translate():
    query = request.json['query']
    query = translate_query(query, 'orkgp', orkg.predicates)
    query = translate_query(query, 'orkgr', orkg.resources)
    return {"query": query}
