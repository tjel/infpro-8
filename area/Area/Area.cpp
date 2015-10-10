#include "stdafx.h"
#include <iostream>

using namespace std;

int main()
{
	double PI = 3.1415; // variables can be initialized during declaration 
	int rad;
	cout << "Enter the radius: \n";
	cin >> rad;
	cout << "Area of the circle is " << PI * rad * rad << "\n\n";

	return 0;
}

