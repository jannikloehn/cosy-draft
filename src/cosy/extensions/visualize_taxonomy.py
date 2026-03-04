import json
import os
import pathlib

from cosy.core.subtypes import Taxonomy
from cosy.extensions.visualize import MyServer


def visualize_taxonomy(taxonomy: Taxonomy):
    taxonomy_list = {k: list(v) for k, v in taxonomy.items()}
    visualization_file_path = pathlib.Path(__file__).parent / "taxonomy_visualization/taxonomy.json"
    with open(visualization_file_path, "w", encoding="utf-8") as visualization_file:
        json.dump(taxonomy_list, visualization_file, indent=4)
    os.chdir(visualization_file_path.parent)
    server = MyServer()
    server.start()
    print(  # noqa: T201
        'Visualization server started. Please open "http://localhost:8000/index.html" to see the visualization.'
    )
    # webbrowser.open("http://localhost:8000/collapsible_tree.html", new=0, autoraise=True)
    input("Press enter to continue...")
    server.stop()