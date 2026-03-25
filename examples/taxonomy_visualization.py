##TaxonomyVisualization##
"""
Overall description of this example goes here.
"""

from cosy.core.specification_builder import SpecificationBuilder
from cosy.core.subtypes import Taxonomy
from cosy.core.types import Constructor, DataGroup, Literal, Type, Var
from cosy.maestro import Maestro
from cosy.extensions.visualize_taxonomy import visualize_taxonomy


def main():
    # range of relevant indices for Fibonacci numbers
    bound = 20

    named_components_with_specifications = [
        (
            "Animal",
            lambda: "Generic Animal",
            SpecificationBuilder().suffix(Constructor("Animal")),
        ),
        (
            "Dog",
            lambda: "Bello",
            SpecificationBuilder().suffix(Constructor("Dog")),
        ),
        (
            "Cat",
            lambda: "Kitty",
            SpecificationBuilder().suffix(Constructor("Cat")),
        )
    ]
    taxonomy: Taxonomy = {
        "Animal": {"Dog", "Cat"},
        "Dog": {"Boxer", "Terrier"},
    }

    # Tell the Maestro about the component specifications
    maestro = Maestro(named_components_with_specifications=named_components_with_specifications, taxonomy=taxonomy)
    maestro.visualize_taxonomy()
    # Target describing Fibonacci numbers at relevant indices
    target: Type = Constructor("Dog")

    # Query the Maestro with the target, then visualize and print results
    results = maestro.query(target)
    for result in results:
        print(result)



if __name__ == "__main__":
    main()





# if __name__ == '__main__':
#     visualize_taxonomy({"a": {"x", "v", "n"}, "x": set(), "v": set(), "n": set()})