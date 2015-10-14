#include "stdafx.h"
#include <iostream>
#include <string>

using namespace std;

int main()
{
	setlocale(LC_ALL, "");

	string readLine = "";
	bool isParsable;

	do
	{
		double PI = 3.1415; 
		int r = 0;
		cout << "Enter the radius: \n";
		getline(cin, readLine);

		try
		{
			r = stoi(readLine);
			isParsable = true;
		}
		catch (...)
		{
			isParsable = false;
		}

		if (isParsable)
		{
			cout << "Area of the circle = " << PI * r * r << "\n\n";
		}
		else
		{
			cout << "Entered Value is not a number\n";
		}
	} 
	while (!isParsable);

	return 0;
}

