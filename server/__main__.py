import click

from endpoint import start


@click.group()
def main():
    pass


@main.command()
@click.option("-p", "--port", type=int)
def run(port: int = 1717):
    start(port, '0.0.0.0')


if __name__ == '__main__':
    main()
